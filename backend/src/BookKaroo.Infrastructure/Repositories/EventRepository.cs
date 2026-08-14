using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Repositories;

public class EventRepository : Repository<Event>, IEventRepository
{
    public EventRepository(BookKarooDbContext db) : base(db) { }

    public async Task<(IEnumerable<Event> Items, int Total)> GetByTypeAsync(
        EventType?        type,
        Guid?             cityId,
        int               page,
        int               pageSize,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        var query = _db.Events
            .Where(e => e.DeletedAt == null
                     && e.Status == MovieStatus.Published
                     && e.EventDate >= now);

        if (type.HasValue)
            query = query.Where(e => e.Type == type.Value);
        else
            // "All" tab: exclude Play and IPL — they have dedicated top-menu pages
            query = query.Where(e => e.Type != EventType.Play && e.Type != EventType.Ipl);

        if (cityId.HasValue)
        {
            var venueIdsInCity = _db.Venues
                .Where(v => v.CityId == cityId.Value && v.DeletedAt == null)
                .Select(v => v.Id);

            // Events with no venue (VenueId == null) are national/touring — show in every city.
            // Events with a venue are shown only when that venue is in the selected city.
            query = query.Where(e => e.VenueId == null || venueIdsInCity.Contains(e.VenueId.Value));
        }

        query = query.OrderBy(e => e.EventDate);

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, total);
    }

    public async Task<Event?> FindBySlugAsync(string slug, CancellationToken ct = default) =>
        await _db.Events
            .Where(e => e.DeletedAt == null && e.Slug == slug)
            .FirstOrDefaultAsync(ct);

    public async Task<Event?> FindSoftDeletedByIdOrSlugAsync(Guid? id, string slug, CancellationToken ct = default)
    {
        var query = _db.Events.IgnoreQueryFilters().Where(e => e.DeletedAt != null);
        if (id.HasValue)
            return await query.FirstOrDefaultAsync(e => e.Id == id.Value, ct);
        return await query.FirstOrDefaultAsync(e => e.Slug == slug, ct);
    }

    public async Task<IEnumerable<Event>> GetUpcomingByTypeAsync(
        EventType         type,
        Guid?             cityId,
        int               count,
        CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        var query = _db.Events
            .Where(e => e.DeletedAt == null
                     && e.Status == MovieStatus.Published
                     && e.Type == type
                     && e.EventDate >= now);

        if (cityId.HasValue)
        {
            var venueIdsInCity = _db.Venues
                .Where(v => v.CityId == cityId.Value && v.DeletedAt == null)
                .Select(v => v.Id);

            query = query.Where(e => e.VenueId == null || venueIdsInCity.Contains(e.VenueId.Value));
        }

        return await query
            .OrderBy(e => e.EventDate)
            .Take(count)
            .ToListAsync(ct);
    }

    public async Task<(IEnumerable<Event> Items, int Total)> GetAllAdminAsync(
        string?           search,
        EventType?        type,
        MovieStatus?      status,
        int               page,
        int               pageSize,
        CancellationToken ct = default)
    {
        var query = _db.Events.Where(e => e.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(e => EF.Functions.ILike(e.Title, $"%{search}%"));
        if (type.HasValue)
            query = query.Where(e => e.Type == type.Value);
        if (status.HasValue)
            query = query.Where(e => e.Status == status.Value);

        query = query.OrderByDescending(e => e.CreatedAt);

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }
}
