using BookKaroo.Application.DTOs.Admin;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Repositories;

public class VenueRepository : Repository<Venue>, IVenueRepository
{
    public VenueRepository(BookKarooDbContext db) : base(db) { }

    public async Task<Venue?> FindBySlugAsync(string slug, CancellationToken ct = default) =>
        await _db.Venues.FirstOrDefaultAsync(v => v.Slug == slug, ct);

    public async Task<(List<VenueAdminDto> Items, int Total)> GetAllAdminAsync(
        string? search, Guid? cityId, string? chain,
        int page, int pageSize, CancellationToken ct = default)
    {
        var query = _db.Venues.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(v =>
                v.Name.ToLower().Contains(search.ToLower()) ||
                (v.Chain != null && v.Chain.ToLower().Contains(search.ToLower())));

        if (cityId.HasValue)
            query = query.Where(v => v.CityId == cityId.Value);

        if (!string.IsNullOrWhiteSpace(chain))
            query = query.Where(v => v.Chain != null && v.Chain.ToLower().Contains(chain.ToLower()));

        var total = await query.CountAsync(ct);

        var venues = await query
            .OrderBy(v => v.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var cityIds = venues.Select(v => v.CityId).Distinct().ToList();
        var cities  = await _db.Cities
            .Where(c => cityIds.Contains(c.Id))
            .ToDictionaryAsync(c => c.Id, ct);

        var venueIds = venues.Select(v => v.Id).ToList();
        var screenCounts = await _db.Screens
            .Where(s => venueIds.Contains(s.VenueId))
            .GroupBy(s => s.VenueId)
            .Select(g => new { VenueId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.VenueId, x => x.Count, ct);

        var items = venues.Select(v =>
        {
            cities.TryGetValue(v.CityId, out var city);
            screenCounts.TryGetValue(v.Id, out var sc);
            return MapVenueAdminDto(v, city, sc);
        }).ToList();

        return (items, total);
    }

    public async Task<VenueWithScreensDto?> GetWithScreensAsync(Guid venueId, CancellationToken ct = default)
    {
        var venue = await _db.Venues.FirstOrDefaultAsync(v => v.Id == venueId, ct);
        if (venue == null) return null;

        var city = await _db.Cities.FirstOrDefaultAsync(c => c.Id == venue.CityId, ct);

        var screens = await _db.Screens
            .Where(s => s.VenueId == venueId)
            .OrderBy(s => s.Name)
            .ToListAsync(ct);

        var screenDtos = screens.Select(s => new ScreenDetailDto(
            s.Id, s.Name, s.TotalSeats, s.IsActive,
            ParseLayout(s.Layout)
        )).ToList();

        return new VenueWithScreensDto(
            venue.Id, venue.Name, venue.Slug, venue.Chain,
            venue.Address, venue.CityId,
            city?.Name ?? "", city?.State ?? "",
            venue.StateCode, venue.Latitude, venue.Longitude,
            ParseAmenities(venue.Amenities),
            venue.IsActive, venue.ContactPhone, venue.ContactEmail,
            screens.Count, venue.CreatedAt, screenDtos);
    }

    public async Task<Dictionary<Guid, string>> GetNamesByIdsAsync(IEnumerable<Guid> ids, CancellationToken ct = default)
    {
        var idList = ids.ToList();
        return await _db.Venues
            .Where(v => idList.Contains(v.Id))
            .ToDictionaryAsync(v => v.Id, v => v.Name, ct);
    }

    public async Task VenueDeleteAsync(Guid id, CancellationToken ct = default)
    {
        var activeShows = await _db.Shows
            .CountAsync(s => s.VenueId == id
                          && s.Status == ShowStatus.Scheduled
                          && s.ShowDatetime > DateTime.UtcNow, ct);

        if (activeShows > 0)
            throw new InvalidOperationException(
                "Cannot delete venue with active upcoming shows. Cancel shows first.");

        var venue = await _db.Venues.FirstOrDefaultAsync(v => v.Id == id, ct);
        if (venue == null) return;

        venue.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    private static VenueAdminDto MapVenueAdminDto(Venue v, City? city, int screenCount) =>
        new(v.Id, v.Name, v.Slug, v.Chain, v.Address,
            v.CityId, city?.Name ?? "", city?.State ?? "",
            v.StateCode, v.Latitude, v.Longitude,
            ParseAmenities(v.Amenities),
            v.IsActive, v.ContactPhone, v.ContactEmail,
            screenCount, v.CreatedAt);

    private static string[] ParseAmenities(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return [];
        try { return System.Text.Json.JsonSerializer.Deserialize<string[]>(raw) ?? []; }
        catch { return raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries); }
    }

    private static object? ParseLayout(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        try { return System.Text.Json.JsonSerializer.Deserialize<object>(raw); }
        catch { return null; }
    }
}
