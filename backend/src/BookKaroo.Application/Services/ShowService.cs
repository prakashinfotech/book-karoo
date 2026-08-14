using System.Text.Json;
using BookKaroo.Application.DTOs.Shows;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Entities;

namespace BookKaroo.Application.Services;

public class ShowService : IShowService
{
    private readonly IShowRepository                  _shows;
    private readonly IRepository<Domain.Entities.Venue>  _venues;
    private readonly IRepository<Domain.Entities.Screen> _screens;
    private readonly IMovieRepository                 _movies;

    public ShowService(
        IShowRepository                   shows,
        IRepository<Domain.Entities.Venue>   venues,
        IRepository<Domain.Entities.Screen>  screens,
        IMovieRepository                  movies)
    {
        _shows   = shows;
        _venues  = venues;
        _screens = screens;
        _movies  = movies;
    }

    public async Task<ShowtimesGroupedResponse> GetShowtimesAsync(
        Guid movieId, Guid cityId, DateOnly date, CancellationToken ct = default)
    {
        var shows   = (await _shows.GetByMovieAndDateAsync(movieId, cityId, date, ct)).ToList();
        var venueIds  = shows.Select(s => s.VenueId).Distinct().ToHashSet();
        var screenIds = shows.Select(s => s.ScreenId).Distinct().ToHashSet();
        var venues  = (await _venues.GetAllAsync(ct)).Where(v => venueIds.Contains(v.Id)).ToDictionary(v => v.Id);
        var screens = (await _screens.GetAllAsync(ct)).Where(s => screenIds.Contains(s.Id)).ToDictionary(s => s.Id);

        var groups = shows
            .GroupBy(s => s.VenueId)
            .Select(g =>
            {
                venues.TryGetValue(g.Key, out var venue);
                var amenities = ParseJsonArray(venue?.Amenities);
                var area      = ExtractArea(venue?.Address);

                var items = g.Select(s =>
                {
                    screens.TryGetValue(s.ScreenId, out var screen);
                    var totalSeats = screen?.TotalSeats ?? 100;

                    // For the grouped listing we use a lightweight count estimate
                    // without hitting the DB per-show (real-time availability is on /seats)
                    var overrides  = ParsePriceOverrides(s.PriceOverrides);
                    var price      = overrides?.GetValueOrDefault("normal", 180m) ?? 180m;
                    var avail      = "green"; // default — full availability returned at /seats

                    return new ShowtimeItem(
                        s.Id,
                        s.ShowTime.ToString(@"hh\:mm tt"),
                        s.Format ?? "2D",
                        s.Language ?? "Hindi",
                        avail,
                        price);
                })
                .OrderBy(s => s.Time)
                .ToArray();

                return new ShowtimeVenueGroup(
                    g.Key,
                    venue?.Name ?? "Unknown Venue",
                    area,
                    null,
                    amenities,
                    items);
            })
            .ToArray();

        return new ShowtimesGroupedResponse(groups);
    }

    public async Task<ShowSeatsResponse> GetSeatsAsync(Guid showId, CancellationToken ct = default)
    {
        var show = await _shows.GetByIdAsync(showId, ct)
            ?? throw new NotFoundException($"Show {showId} not found.");

        var availability = await _shows.GetSeatAvailabilityAsync(showId, ct);

        object? layout = null;
        var allScreens = await _screens.GetAllAsync(ct);
        var screen = allScreens.FirstOrDefault(s => s.Id == show.ScreenId);
        if (screen?.Layout is not null)
        {
            try { layout = JsonSerializer.Deserialize<object>(screen.Layout); }
            catch { /* leave null */ }
        }

        // Resolve metadata for checkout page display
        var allVenues = await _venues.GetAllAsync(ct);
        var venue     = allVenues.FirstOrDefault(v => v.Id == show.VenueId);
        var movie     = show.MovieId.HasValue
            ? await _movies.GetByIdAsync(show.MovieId.Value, ct) : null;

        var showMeta = new ShowMetadata(
            MovieTitle: movie?.Title ?? "Movie",
            PosterUrl:  movie?.PosterUrl,
            Format:     show.Format ?? "2D",
            Language:   show.Language ?? "Hindi",
            ShowDate:   show.ShowDate.ToString("yyyy-MM-dd"),
            ShowTime:   show.ShowTime.ToString(@"hh\:mm tt"),
            VenueName:  venue?.Name ?? "Cinema",
            ScreenName: screen?.Name ?? "Screen");

        return new ShowSeatsResponse(showId, layout, availability.BookedSeats, availability.LockedSeats, showMeta);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static string[] ParseJsonArray(string? json)
    {
        if (json is null) return [];
        try { return JsonSerializer.Deserialize<string[]>(json) ?? []; }
        catch { return []; }
    }

    private static Dictionary<string, decimal>? ParsePriceOverrides(string? json)
    {
        if (json is null) return null;
        try { return JsonSerializer.Deserialize<Dictionary<string, decimal>>(json); }
        catch { return null; }
    }

    private static string ExtractArea(string? address)
    {
        if (string.IsNullOrWhiteSpace(address)) return string.Empty;
        var parts = address.Split(',');
        return parts.Length >= 2 ? parts[^2].Trim() : parts[0].Trim();
    }
}
