using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Domain.Entities;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Repositories;

public class PartnerRepository : IPartnerRepository
{
    private readonly BookKarooDbContext _db;
    public PartnerRepository(BookKarooDbContext db) => _db = db;

    public async Task<PartnerProfile?> GetByUserIdAsync(Guid userId, CancellationToken ct) =>
        await _db.PartnerProfiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);

    public async Task<PartnerProfile?> GetByIdAsync(Guid partnerId, CancellationToken ct) =>
        await _db.PartnerProfiles.FirstOrDefaultAsync(p => p.Id == partnerId, ct);

    public async Task<List<Guid>> GetVenueIdsAsync(Guid partnerId, CancellationToken ct) =>
        await _db.PartnerVenueAccesses
            .Where(a => a.PartnerId == partnerId && a.IsActive)
            .Select(a => a.VenueId)
            .ToListAsync(ct);

    public async Task<List<PartnerVenueAccess>> GetVenueAccessAsync(Guid partnerId, CancellationToken ct) =>
        await _db.PartnerVenueAccesses
            .Where(a => a.PartnerId == partnerId && a.IsActive)
            .ToListAsync(ct);

    public async Task<PartnerProfile> AddAsync(PartnerProfile profile, CancellationToken ct)
    {
        await _db.PartnerProfiles.AddAsync(profile, ct);
        await _db.SaveChangesAsync(ct);
        return profile;
    }

    public async Task UpdateAsync(PartnerProfile profile, CancellationToken ct)
    {
        _db.PartnerProfiles.Update(profile);
        await _db.SaveChangesAsync(ct);
    }

    public async Task AddVenueAccessAsync(PartnerVenueAccess access, CancellationToken ct)
    {
        await _db.PartnerVenueAccesses.AddAsync(access, ct);
        await _db.SaveChangesAsync(ct);
    }

    public async Task SetVenueAccessActiveAsync(Guid partnerId, Guid venueId, bool isActive, CancellationToken ct)
    {
        var access = await _db.PartnerVenueAccesses
            .FirstOrDefaultAsync(a => a.PartnerId == partnerId && a.VenueId == venueId, ct);
        if (access != null)
        {
            access.IsActive = isActive;
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task<(List<PartnerWithVenues> Items, int Total)> GetAllAdminAsync(
        string? search, bool? isActive, int page, int pageSize, CancellationToken ct)
    {
        var query = _db.PartnerProfiles.AsQueryable();
        if (isActive.HasValue)
            query = query.Where(p => p.IsActive == isActive.Value);

        var total = await query.CountAsync(ct);

        var profiles = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var result = new List<PartnerWithVenues>();
        foreach (var profile in profiles)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == profile.UserId, ct);
            if (user == null) continue;

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.ToLower();
                if (!user.Name.ToLower().Contains(q) &&
                    !user.Email.ToLower().Contains(q) &&
                    !profile.BusinessName.ToLower().Contains(q))
                    continue;
            }

            var venueAccesses = await _db.PartnerVenueAccesses
                .Where(a => a.PartnerId == profile.Id && a.IsActive)
                .ToListAsync(ct);

            var venues = new List<PartnerVenueInfo>();
            foreach (var access in venueAccesses)
            {
                var venue = await _db.Venues.FirstOrDefaultAsync(v => v.Id == access.VenueId, ct);
                if (venue != null)
                {
                    var city = await _db.Cities.FirstOrDefaultAsync(c => c.Id == venue.CityId, ct);
                    venues.Add(new PartnerVenueInfo(venue.Id, venue.Name, city?.Name ?? "—", access.GrantedAt, venue.ContactPhone, venue.ContactEmail));
                }
            }

            result.Add(new PartnerWithVenues(profile, user.Name, user.Email, user.Mobile, venues));
        }

        return (result, total);
    }
}
