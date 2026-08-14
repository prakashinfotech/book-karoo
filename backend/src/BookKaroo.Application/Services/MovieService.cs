using System.Text.Json;
using BookKaroo.Application.DTOs.Movies;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Enums;

namespace BookKaroo.Application.Services;

public class MovieService : IMovieService
{
    private readonly IMovieRepository               _movies;
    private readonly IShowRepository                _shows;
    private readonly IRepository<Domain.Entities.Venue> _venues;
    private readonly IReviewRepository              _reviews;

    public MovieService(
        IMovieRepository               movies,
        IShowRepository                shows,
        IRepository<Domain.Entities.Venue> venues,
        IReviewRepository              reviews)
    {
        _movies  = movies;
        _shows   = shows;
        _venues  = venues;
        _reviews = reviews;
    }

    public async Task<MovieListPagedResponse> GetListAsync(MovieFilterRequest filter, CancellationToken ct = default)
    {
        MovieCategory? cat = filter.Category switch
        {
            "NowShowing" => MovieCategory.NowShowing,
            "ComingSoon" => MovieCategory.ComingSoon,
            "Exclusive"  => MovieCategory.Exclusive,
            "Premiere"   => MovieCategory.Premiere,
            _            => null
        };

        var (items, total) = await _movies.GetPublishedAsync(
            filter.Languages, filter.Genres, filter.Formats, cat,
            filter.CityId, filter.Sort, filter.Page, filter.PageSize, ct);

        var totalPages = filter.PageSize == 0 ? 0 : (int)Math.Ceiling((double)total / filter.PageSize);
        return new MovieListPagedResponse(items.Select(MapList), total, filter.Page, filter.PageSize, totalPages);
    }

    public async Task<MovieDetailResponse> GetDetailAsync(string slug, Guid? userId, CancellationToken ct = default)
    {
        var movie = await _movies.FindBySlugAsync(slug, ct)
            ?? throw new NotFoundException($"Movie '{slug}' not found.");

        var avgRating    = await _reviews.GetAverageRatingAsync(movie.Id, ct);
        var distribution = await _reviews.GetRatingDistributionAsync(movie.Id, ct);
        var totalReviews = distribution.Values.Sum();
        var related      = await _movies.GetRelatedAsync(movie.Id, movie.Genres, 3, ct);

        var canReview = false;
        if (userId.HasValue)
        {
            var hasBooked   = await _reviews.HasUserBookedMovieAsync(userId.Value, movie.Id, ct);
            var hasReviewed = await _reviews.HasUserReviewedAsync(userId.Value, movie.Id, ct);
            canReview = hasBooked && !hasReviewed;
        }

        return new MovieDetailResponse(
            movie.Id, movie.Title, movie.Slug, movie.Description, movie.DurationMin,
            movie.Languages, movie.Formats, movie.Genres,
            movie.Certificate, movie.ReleaseDate?.ToString("yyyy-MM-dd"),
            movie.PosterUrl, movie.BackdropUrl, movie.TrailerUrl,
            movie.ImdbRating, movie.Status.ToString(), movie.Category.ToString(),
            ParseCast(movie.Cast),
            ParseCrew(movie.Crew),
            avgRating,
            distribution,
            totalReviews,
            related.Select(MapList),
            canReview);
    }

    public async Task<ShowtimesResponse> GetShowtimesAsync(string slug, string? date, CancellationToken ct = default)
    {
        var movie = await _movies.FindBySlugAsync(slug, ct)
            ?? throw new NotFoundException($"Movie '{slug}' not found.");

        var showDate  = date is not null ? DateOnly.Parse(date) : DateOnly.FromDateTime(DateTime.Today);
        var shows     = (await _shows.GetByMovieAndDateAsync(movie.Id, showDate, ct)).ToList();
        var allVenues = (await _venues.GetAllAsync(ct)).ToDictionary(v => v.Id);

        var grouped = shows
            .GroupBy(s => s.VenueId)
            .Select(g =>
            {
                allVenues.TryGetValue(g.Key, out var venue);
                var amenities = venue?.Amenities is not null
                    ? JsonSerializer.Deserialize<string[]>(venue.Amenities) ?? []
                    : [];

                var slots = g.Select(s =>
                {
                    var overrides = s.PriceOverrides is not null
                        ? JsonSerializer.Deserialize<Dictionary<string, decimal>>(s.PriceOverrides)
                        : null;
                    var price = overrides?.GetValueOrDefault("normal", 180m) ?? 180m;
                    return new ShowtimeSlotResponse(
                        s.Id, s.ShowTime.ToString(@"hh\:mm tt"),
                        s.Format ?? "2D", s.Language ?? "Hindi", SeatsLeft: 100, Price: price);
                }).OrderBy(s => s.ShowTime).ToArray();

                return new ShowtimeVenueResponse(
                    g.Key, venue?.Name ?? "Unknown Venue", venue?.Address, null, amenities,
                    slots.Any() ? slots.Min(s => s.Price) : 180m, slots);
            })
            .ToArray();

        return new ShowtimesResponse(grouped);
    }

    // ── Mappers ──────────────────────────────────────────────────────────────────

    private static MovieListResponse MapList(Domain.Entities.Movie m) => new(
        m.Id, m.Title, m.Slug, m.Description, m.DurationMin,
        m.Languages, m.Formats, m.Genres,
        m.Certificate, m.ReleaseDate?.ToString("yyyy-MM-dd"),
        m.PosterUrl, m.BackdropUrl, m.TrailerUrl,
        m.ImdbRating, m.Status.ToString(), m.Category.ToString());

    private static CastMember[] ParseCast(string? json)
    {
        if (json is null) return [];
        try
        {
            return JsonSerializer.Deserialize<JsonElement[]>(json)?
                .Select(e =>
                {
                    var name = e.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";

                    // Accept "role" (admin form) or "character" (TMDB API format)
                    var role = (e.TryGetProperty("role",      out var r) ? r.GetString() : null)
                            ?? (e.TryGetProperty("character", out var c) ? c.GetString() : null)
                            ?? "";

                    // Accept "photo" (admin form) or "profile_path" (TMDB API path)
                    string? photo = null;
                    if (e.TryGetProperty("photo",        out var ph) && ph.ValueKind != JsonValueKind.Null)
                        photo = ph.GetString();
                    else if (e.TryGetProperty("profile_path", out var pp) && pp.ValueKind != JsonValueKind.Null)
                        photo = pp.GetString();

                    return new CastMember(name, role, photo);
                })
                .Take(10)
                .ToArray() ?? [];
        }
        catch { return []; }
    }

    private static CrewMember[] ParseCrew(string? json)
    {
        if (json is null) return [];
        try
        {
            return JsonSerializer.Deserialize<JsonElement[]>(json)?
                .Where(e =>
                    // Admin form format: has "role" field directly — include all
                    e.TryGetProperty("role", out _) ||
                    // TMDB API format: filter by department
                    (e.TryGetProperty("department", out var d) &&
                     d.GetString() is "Directing" or "Writing" or "Production"))
                .Select(e => new CrewMember(
                    e.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "",
                    // Accept "role" (admin form) or "job" (TMDB API format)
                    (e.TryGetProperty("role", out var r) ? r.GetString() : null)
                    ?? (e.TryGetProperty("job",  out var j) ? j.GetString() : null)
                    ?? ""))
                .Take(10)
                .ToArray() ?? [];
        }
        catch { return []; }
    }
}
