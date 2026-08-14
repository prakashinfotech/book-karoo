using System.Text.Json;
using BookKaroo.Application.DTOs.Events;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;

namespace BookKaroo.Application.Services;

public class EventService : IEventService
{
    private readonly IEventRepository  _events;
    private readonly IRepository<Venue> _venues;
    private readonly ICityRepository   _cities;

    public EventService(
        IEventRepository  events,
        IRepository<Venue> venues,
        ICityRepository   cities)
    {
        _events = events;
        _venues = venues;
        _cities = cities;
    }

    public async Task<(IReadOnlyList<EventListResponse> Items, int Total, int TotalPages)> GetListAsync(
        EventType? type,
        Guid?      cityId,
        int        page,
        int        pageSize,
        CancellationToken ct = default)
    {
        var (items, total) = await _events.GetByTypeAsync(type, cityId, page, pageSize, ct);

        var venueIds = items.Where(e => e.VenueId.HasValue).Select(e => e.VenueId!.Value).Distinct().ToList();
        var venues   = (await _venues.GetAllAsync(ct))
            .Where(v => venueIds.Contains(v.Id))
            .ToDictionary(v => v.Id);

        var cityIds  = venues.Values.Select(v => v.CityId).Distinct().ToList();
        var cities   = (await _cities.GetAllAsync(ct))
            .Where(c => cityIds.Contains(c.Id))
            .ToDictionary(c => c.Id);

        var responses = items.Select(e => MapList(e, venues, cities)).ToList();
        var totalPages = pageSize == 0 ? 0 : (int)Math.Ceiling((double)total / pageSize);

        return (responses, total, totalPages);
    }

    public async Task<EventDetailResponse> GetDetailAsync(string slug, CancellationToken ct = default)
    {
        var ev = await _events.FindBySlugAsync(slug, ct)
            ?? throw new NotFoundException($"Event '{slug}' not found.");

        Venue? venue = null;
        Domain.Entities.City? city = null;

        if (ev.VenueId.HasValue)
        {
            venue = await _venues.GetByIdAsync(ev.VenueId.Value, ct);
            if (venue is not null)
                city = await _cities.GetByIdAsync(venue.CityId, ct);
        }

        var priceTiers    = ParsePriceTiers(ev.PriceTiers);
        var artists       = ParseArtists(ev.Artists);
        var organizer     = ParseOrganizer(ev.Organizer);
        var venueAmenities = ParseAmenities(venue?.Amenities);

        return new EventDetailResponse(
            ev.Id,
            ev.Title,
            ev.Slug,
            ev.Type.ToString(),
            ev.PosterUrl,
            ev.BackdropUrl,
            ev.EventDate?.ToString("O"),
            FormatDate(ev.EventDate),
            FormatTime(ev.EventDate),
            ev.Language,
            ev.AgeRestriction ?? 0,
            ev.DurationMin == 0 ? null : ev.DurationMin,
            venue?.Name ?? ev.VenueName ?? "TBA",
            city?.Name  ?? ev.CityName  ?? "TBA",
            priceTiers,
            priceTiers.Count > 0 ? priceTiers.Min(p => p.Price) : 0m,
            artists,
            ev.Status.ToString(),
            ev.Description,
            organizer,
            venue?.Address,
            venueAmenities,
            venue?.Latitude  ?? ev.VenueLatitude,
            venue?.Longitude ?? ev.VenueLongitude,
            priceTiers);
    }

    public async Task<IReadOnlyList<EventListResponse>> GetByTypeAsync(
        EventType         type,
        Guid?             cityId,
        int               count,
        CancellationToken ct = default)
    {
        var items  = (await _events.GetUpcomingByTypeAsync(type, cityId, count, ct)).ToList();

        var venueIds = items.Where(e => e.VenueId.HasValue).Select(e => e.VenueId!.Value).Distinct().ToList();
        var venues   = (await _venues.GetAllAsync(ct))
            .Where(v => venueIds.Contains(v.Id))
            .ToDictionary(v => v.Id);

        var cityIds = venues.Values.Select(v => v.CityId).Distinct().ToList();
        var cities  = (await _cities.GetAllAsync(ct))
            .Where(c => cityIds.Contains(c.Id))
            .ToDictionary(c => c.Id);

        return items.Select(e => MapList(e, venues, cities)).ToList();
    }

    // ── Mappers ─────────────────────────────────────────────────────────────────

    private static EventListResponse MapList(
        Event                          ev,
        Dictionary<Guid, Venue>        venues,
        Dictionary<Guid, City> cities)
    {
        venues.TryGetValue(ev.VenueId ?? Guid.Empty, out var venue);
        cities.TryGetValue(venue?.CityId ?? Guid.Empty, out var city);

        var priceTiers = ParsePriceTiers(ev.PriceTiers);
        var artists    = ParseArtists(ev.Artists);

        return new EventListResponse(
            ev.Id,
            ev.Title,
            ev.Slug,
            ev.Type.ToString(),
            ev.PosterUrl,
            ev.BackdropUrl,
            ev.EventDate?.ToString("O"),
            FormatDate(ev.EventDate),
            FormatTime(ev.EventDate),
            ev.Language,
            ev.AgeRestriction ?? 0,
            ev.DurationMin == 0 ? null : ev.DurationMin,
            venue?.Name ?? ev.VenueName ?? "TBA",
            city?.Name  ?? ev.CityName  ?? "TBA",
            priceTiers,
            priceTiers.Count > 0 ? priceTiers.Min(p => p.Price) : 0m,
            artists,
            ev.Status.ToString());
    }

    private static IReadOnlyList<PriceTier> ParsePriceTiers(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<JsonElement[]>(json)?
                .Select(e => new PriceTier(
                    e.TryGetProperty("name",     out var n) ? n.GetString() ?? "" : "",
                    e.TryGetProperty("price",    out var p) ? p.GetDecimal()      : 0m,
                    e.TryGetProperty("capacity", out var c) ? c.GetInt32()        : 0,
                    e.TryGetProperty("color",    out var col) ? col.GetString() ?? "#6366F1" : "#6366F1"))
                .ToList() ?? [];
        }
        catch { return []; }
    }

    private static IReadOnlyList<Artist> ParseArtists(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<JsonElement[]>(json)?
                .Select(e => new Artist(
                    e.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "",
                    e.TryGetProperty("type", out var t) ? t.GetString() ?? "" : "Artist"))
                .ToList() ?? [];
        }
        catch { return []; }
    }

    private static OrganizerInfo? ParseOrganizer(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            var el = JsonSerializer.Deserialize<JsonElement>(json);
            return new OrganizerInfo(
                el.TryGetProperty("name",    out var n) ? n.GetString() ?? "TBA" : "TBA",
                el.TryGetProperty("contact", out var c) ? c.GetString()          : null,
                el.TryGetProperty("stadium", out var s) ? s.GetString()          : null);
        }
        catch { return null; }
    }

    private static string[] ParseAmenities(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try { return JsonSerializer.Deserialize<string[]>(json) ?? []; }
        catch { return []; }
    }

    private static string FormatDate(DateTime? dt) =>
        dt?.ToLocalTime().ToString("ddd, d MMM yyyy") ?? "TBA";

    private static string FormatTime(DateTime? dt) =>
        dt?.ToLocalTime().ToString("hh:mm tt") ?? "TBA";
}
