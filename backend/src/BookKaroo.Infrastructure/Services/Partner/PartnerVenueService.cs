using BookKaroo.Application.Common;
using BookKaroo.Application.DTOs.Partner;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Entities;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Services.Partner;

public class PartnerVenueService : IPartnerVenueService
{
    private readonly BookKarooDbContext _db;
    public PartnerVenueService(BookKarooDbContext db) => _db = db;

    public async Task<List<PartnerVenueListItem>> GetMyVenuesAsync(IPartnerContext ctx, CancellationToken ct)
    {
        var venueIds = ctx.VenueIds.ToList();
        var venues = await _db.Venues.Where(v => venueIds.Contains(v.Id)).ToListAsync(ct);
        var items = new List<PartnerVenueListItem>();
        foreach (var v in venues)
        {
            var city = await _db.Cities.FirstOrDefaultAsync(c => c.Id == v.CityId, ct);
            var screenCount = await _db.Screens.CountAsync(s => s.VenueId == v.Id, ct);
            items.Add(new PartnerVenueListItem(
                v.Id, v.Name, v.Address, city?.Name ?? "—",
                v.IsActive, v.ContactPhone, v.ContactEmail, screenCount));
        }
        return items;
    }

    public async Task<PartnerVenueDetail> GetVenueWithScreensAsync(IPartnerContext ctx, Guid venueId, CancellationToken ct)
    {
        ctx.EnsureVenueAccess(venueId);
        var venue = await _db.Venues.FirstOrDefaultAsync(v => v.Id == venueId, ct)
            ?? throw new NotFoundException("Venue not found");
        var city = await _db.Cities.FirstOrDefaultAsync(c => c.Id == venue.CityId, ct);
        var screens = await _db.Screens.Where(s => s.VenueId == venueId).ToListAsync(ct);
        var screenInfos = screens
            .Select(s => new PartnerScreenInfo(s.Id, s.Name, s.TotalSeats, s.Layout))
            .ToList();
        return new PartnerVenueDetail(
            venue.Id, venue.Name, venue.Slug, venue.Address, venue.CityId, city?.Name ?? "—",
            venue.Chain, venue.Amenities, venue.IsActive, venue.ContactPhone, venue.ContactEmail,
            screenInfos);
    }

    public async Task<PartnerVenueDetail> UpdateVenueOperationalDetailsAsync(
        IPartnerContext ctx, Guid venueId, UpdateVenueOperationalRequest req, CancellationToken ct)
    {
        ctx.EnsureVenueAccess(venueId);
        var venue = await _db.Venues.FirstOrDefaultAsync(v => v.Id == venueId, ct)
            ?? throw new NotFoundException("Venue not found");
        if (req.ContactPhone != null) venue.ContactPhone = req.ContactPhone;
        if (req.ContactEmail != null) venue.ContactEmail = req.ContactEmail;
        if (req.Amenities    != null) venue.Amenities    = req.Amenities;
        await _db.SaveChangesAsync(ct);
        return await GetVenueWithScreensAsync(ctx, venueId, ct);
    }

    public async Task<PartnerScreenInfo> CreateScreenAsync(
        IPartnerContext ctx, Guid venueId, CreateScreenRequest req, CancellationToken ct)
    {
        ctx.EnsureVenueAccess(venueId);
        if (string.IsNullOrWhiteSpace(req.Name)) throw new ValidationException(new() { ["name"] = new[] { "Name required" } });
        if (req.TotalSeats <= 0) throw new ValidationException(new() { ["totalSeats"] = new[] { "TotalSeats must be > 0" } });

        var screen = new Screen
        {
            VenueId    = venueId,
            Name       = req.Name,
            TotalSeats = req.TotalSeats,
            Layout     = req.Layout,
            IsActive   = true
        };
        await _db.Screens.AddAsync(screen, ct);
        await _db.SaveChangesAsync(ct);
        return new PartnerScreenInfo(screen.Id, screen.Name, screen.TotalSeats, screen.Layout);
    }

    public async Task<PartnerScreenInfo> UpdateScreenAsync(
        IPartnerContext ctx, Guid screenId, UpdateScreenRequest req, CancellationToken ct)
    {
        var screen = await _db.Screens.FirstOrDefaultAsync(s => s.Id == screenId, ct)
            ?? throw new NotFoundException("Screen not found");
        ctx.EnsureVenueAccess(screen.VenueId);

        if (req.Name       != null) screen.Name       = req.Name;
        if (req.TotalSeats.HasValue) screen.TotalSeats = req.TotalSeats.Value;
        if (req.Layout     != null) screen.Layout     = req.Layout;
        await _db.SaveChangesAsync(ct);
        return new PartnerScreenInfo(screen.Id, screen.Name, screen.TotalSeats, screen.Layout);
    }

    public async Task DeleteScreenAsync(IPartnerContext ctx, Guid screenId, CancellationToken ct)
    {
        var screen = await _db.Screens.FirstOrDefaultAsync(s => s.Id == screenId, ct)
            ?? throw new NotFoundException("Screen not found");
        ctx.EnsureVenueAccess(screen.VenueId);

        // Prevent delete if active shows reference this screen
        var hasActiveShows = await _db.Shows.AnyAsync(s => s.ScreenId == screenId && s.Status == BookKaroo.Domain.Enums.ShowStatus.Scheduled, ct);
        if (hasActiveShows)
            throw new ConflictException("Cannot delete a screen with scheduled shows");

        screen.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
