using System.Security.Cryptography;
using BookKaroo.Application.DTOs.Partner;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Services.Partner;

public class AdminPartnerService : IAdminPartnerService
{
    private readonly BookKarooDbContext _db;
    private readonly IPartnerRepository _partners;
    private readonly IUserRepository    _users;

    public AdminPartnerService(BookKarooDbContext db, IPartnerRepository partners, IUserRepository users)
    {
        _db = db; _partners = partners; _users = users;
    }

    public async Task<AdminPartnerPage> GetAllAsync(string? search, bool? isActive, int page, int pageSize, CancellationToken ct)
    {
        var (items, total) = await _partners.GetAllAdminAsync(search, isActive, page, pageSize, ct);
        var dtos = items.Select(MapToResponse).ToList();
        return new AdminPartnerPage(dtos, total, page, pageSize);
    }

    public async Task<AdminPartnerResponse> GetByIdAsync(Guid partnerId, CancellationToken ct)
    {
        var partner = await _partners.GetByIdAsync(partnerId, ct)
            ?? throw new NotFoundException("Partner not found");
        return await BuildResponseAsync(partner, ct);
    }

    public async Task<CreatePartnerResponse> CreatePartnerAsync(CreatePartnerRequest req, Guid? createdBy, CancellationToken ct)
    {
        var existing = await _users.FindByEmailAsync(req.Email.ToLowerInvariant(), ct);
        if (existing != null)
            throw new ConflictException("A user with this email already exists");

        var tempPassword = GenerateTempPassword();
        var user = new User
        {
            Email         = req.Email.ToLowerInvariant(),
            Mobile        = req.Mobile,
            Name          = req.Name,
            PasswordHash  = BCrypt.Net.BCrypt.HashPassword(tempPassword, workFactor: 12),
            Role          = UserRole.Partner,
            EmailVerified = false
        };
        await _users.AddAsync(user, ct);

        var profile = new PartnerProfile
        {
            UserId        = user.Id,
            BusinessName  = req.BusinessName,
            ContactPerson = req.ContactPerson,
            ContactPhone  = req.ContactPhone,
            ContactEmail  = req.ContactEmail,
            GstNumber     = req.GstNumber,
            PanNumber     = req.PanNumber,
            Notes         = req.Notes,
            IsActive      = true,
            CreatedBy     = createdBy
        };
        profile = await _partners.AddAsync(profile, ct);

        foreach (var venueId in req.VenueIds.Distinct())
        {
            var venueExists = await _db.Venues.AnyAsync(v => v.Id == venueId, ct);
            if (!venueExists) continue;
            await _partners.AddVenueAccessAsync(new PartnerVenueAccess
            {
                PartnerId = profile.Id,
                VenueId   = venueId,
                GrantedBy = createdBy,
                IsActive  = true
            }, ct);
        }

        var response = await BuildResponseAsync(profile, ct);
        return new CreatePartnerResponse(response, tempPassword);
    }

    public async Task<AdminPartnerResponse> UpdatePartnerAsync(Guid partnerId, UpdatePartnerRequest req, CancellationToken ct)
    {
        var partner = await _partners.GetByIdAsync(partnerId, ct)
            ?? throw new NotFoundException("Partner not found");
        partner.BusinessName  = req.BusinessName;
        partner.ContactPerson = req.ContactPerson;
        partner.ContactPhone  = req.ContactPhone;
        partner.ContactEmail  = req.ContactEmail;
        partner.GstNumber     = req.GstNumber;
        partner.PanNumber     = req.PanNumber;
        partner.Notes         = req.Notes;
        await _partners.UpdateAsync(partner, ct);
        return await BuildResponseAsync(partner, ct);
    }

    public async Task<AdminPartnerResponse> SetActiveAsync(Guid partnerId, bool isActive, CancellationToken ct)
    {
        var partner = await _partners.GetByIdAsync(partnerId, ct)
            ?? throw new NotFoundException("Partner not found");
        partner.IsActive = isActive;
        await _partners.UpdateAsync(partner, ct);
        return await BuildResponseAsync(partner, ct);
    }

    public async Task<AdminPartnerResponse> GrantVenueAccessAsync(Guid partnerId, Guid venueId, Guid? grantedBy, CancellationToken ct)
    {
        var partner = await _partners.GetByIdAsync(partnerId, ct)
            ?? throw new NotFoundException("Partner not found");
        var venueExists = await _db.Venues.AnyAsync(v => v.Id == venueId, ct);
        if (!venueExists) throw new NotFoundException("Venue not found");

        var existing = await _db.PartnerVenueAccesses
            .FirstOrDefaultAsync(a => a.PartnerId == partnerId && a.VenueId == venueId, ct);
        if (existing != null)
        {
            existing.IsActive = true;
            existing.GrantedAt = DateTime.UtcNow;
            existing.GrantedBy = grantedBy;
            await _db.SaveChangesAsync(ct);
        }
        else
        {
            await _partners.AddVenueAccessAsync(new PartnerVenueAccess
            {
                PartnerId = partnerId,
                VenueId   = venueId,
                GrantedBy = grantedBy,
                IsActive  = true
            }, ct);
        }
        return await BuildResponseAsync(partner, ct);
    }

    public async Task<AdminPartnerResponse> RevokeVenueAccessAsync(Guid partnerId, Guid venueId, CancellationToken ct)
    {
        var partner = await _partners.GetByIdAsync(partnerId, ct)
            ?? throw new NotFoundException("Partner not found");
        await _partners.SetVenueAccessActiveAsync(partnerId, venueId, false, ct);
        return await BuildResponseAsync(partner, ct);
    }

    // ── helpers ────────────────────────────────────────────────────────────
    private async Task<AdminPartnerResponse> BuildResponseAsync(PartnerProfile partner, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == partner.UserId, ct);
        var accesses = await _db.PartnerVenueAccesses
            .Where(a => a.PartnerId == partner.Id && a.IsActive)
            .ToListAsync(ct);
        var venueAccess = new List<AdminPartnerVenueAccess>();
        foreach (var a in accesses)
        {
            var v = await _db.Venues.FirstOrDefaultAsync(x => x.Id == a.VenueId, ct);
            if (v == null) continue;
            var c = await _db.Cities.FirstOrDefaultAsync(x => x.Id == v.CityId, ct);
            venueAccess.Add(new AdminPartnerVenueAccess(v.Id, v.Name, c?.Name ?? "—", a.GrantedAt, v.ContactPhone, v.ContactEmail));
        }
        return new AdminPartnerResponse(
            partner.Id, partner.UserId, user?.Name ?? "—", user?.Email ?? "—", user?.Mobile,
            partner.BusinessName, partner.ContactPerson, partner.ContactPhone, partner.ContactEmail,
            partner.GstNumber, partner.PanNumber, partner.Notes, partner.IsActive,
            venueAccess, partner.CreatedAt);
    }

    private static AdminPartnerResponse MapToResponse(PartnerWithVenues p)
    {
        var venueAccess = p.Venues
            .Select(v => new AdminPartnerVenueAccess(v.VenueId, v.VenueName, v.CityName, v.GrantedAt, v.ContactPhone, v.ContactEmail))
            .ToList();
        return new AdminPartnerResponse(
            p.Profile.Id, p.Profile.UserId, p.UserName, p.UserEmail, p.UserMobile,
            p.Profile.BusinessName, p.Profile.ContactPerson, p.Profile.ContactPhone, p.Profile.ContactEmail,
            p.Profile.GstNumber, p.Profile.PanNumber, p.Profile.Notes, p.Profile.IsActive,
            venueAccess, p.Profile.CreatedAt);
    }

    private static string GenerateTempPassword()
    {
        const string chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        var rand = RandomNumberGenerator.GetBytes(8);
        var sb = new System.Text.StringBuilder("BK-");
        foreach (var b in rand) sb.Append(chars[b % chars.Length]);
        return sb.ToString();
    }
}
