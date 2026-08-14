using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Repositories;

public class MovieRepository : Repository<Movie>, IMovieRepository
{
    public MovieRepository(BookKarooDbContext db) : base(db) { }

    public async Task<Movie?> FindBySlugAsync(string slug, CancellationToken ct = default) =>
        await _db.Movies.FirstOrDefaultAsync(m => m.Slug == slug, ct);

    public async Task<(IEnumerable<Movie> Items, int Total)> GetPublishedAsync(
        string[]?      languages,
        string[]?      genres,
        string[]?      formats,
        MovieCategory? category,
        Guid?          cityId,
        string?        sort,
        int            page,
        int            pageSize,
        CancellationToken ct = default)
    {
        var query = _db.Movies.Where(m => m.Status == MovieStatus.Published);

        // Multi-value array overlap: movie must have at least one of the selected values
        if (languages?.Length > 0)
            query = query.Where(m => languages.Any(l => m.Languages.Contains(l)));
        if (genres?.Length > 0)
            query = query.Where(m => genres.Any(g => m.Genres.Contains(g)));
        if (formats?.Length > 0)
            query = query.Where(m => formats.Any(f => m.Formats.Contains(f)));
        if (category.HasValue)
            query = query.Where(m => m.Category == category.Value);

        // City filter: only movies with scheduled shows in that city (skip for Coming Soon — no shows by design)
        if (cityId.HasValue && category != MovieCategory.ComingSoon)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var venueIdsInCity = _db.Venues
                .Where(v => v.CityId == cityId.Value)
                .Select(v => v.Id);

            var movieIdsInCity = _db.Shows
                .Where(s => venueIdsInCity.Contains(s.VenueId)
                         && s.ShowDate >= today
                         && s.MovieId != null
                         && s.Status != ShowStatus.Cancelled)
                .Select(s => s.MovieId!.Value)
                .Distinct();

            query = query.Where(m => movieIdsInCity.Contains(m.Id));
        }

        query = sort switch
        {
            "rating"  => query.OrderByDescending(m => m.ImdbRating),
            "release" => query.OrderByDescending(m => m.ReleaseDate),
            "az"      => query.OrderBy(m => m.Title),
            _         => query.OrderByDescending(m => m.ImdbRating) // popularity ≈ IMDb rating
        };

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public async Task<IEnumerable<Movie>> GetRelatedAsync(
        Guid movieId, string[] genres, int count, CancellationToken ct = default) =>
        await _db.Movies
            .Where(m => m.Id != movieId
                     && m.Status == MovieStatus.Published
                     && genres.Any(g => m.Genres.Contains(g)))
            .OrderByDescending(m => m.ImdbRating)
            .Take(count)
            .ToListAsync(ct);

    public async Task<(IEnumerable<Movie> Items, int Total)> GetAllAdminAsync(
        string?           search,
        MovieStatus?      status,
        MovieCategory?    category,
        int               page,
        int               pageSize,
        CancellationToken ct = default)
    {
        var query = _db.Movies.Where(m => m.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(m => EF.Functions.ILike(m.Title, $"%{search}%"));
        if (status.HasValue)
            query = query.Where(m => m.Status == status.Value);
        if (category.HasValue)
            query = query.Where(m => m.Category == category.Value);

        query = query.OrderByDescending(m => m.CreatedAt);

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public async Task<Movie?> FindByTmdbIdAsync(int tmdbId, CancellationToken ct = default) =>
        await _db.Movies.FirstOrDefaultAsync(m => m.TmdbId == tmdbId && m.DeletedAt == null, ct);
}
