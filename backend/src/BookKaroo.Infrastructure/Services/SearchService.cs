using BookKaroo.Application.DTOs.Search;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Enums;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Services;

public class SearchService : ISearchService
{
    private readonly BookKarooDbContext _db;

    public SearchService(BookKarooDbContext db) => _db = db;

    public async Task<SearchResponse> SearchAsync(string query, Guid? cityId, CancellationToken ct = default)
    {
        if (query.Length < 2)
            return new SearchResponse([], [], [], [], query, 0);

        var movies = await _db.Movies
            .Where(m => m.DeletedAt == null
                     && m.Status == MovieStatus.Published
                     && EF.Functions.ILike(m.Title, $"%{query}%"))
            .OrderBy(m => EF.Functions.ILike(m.Title, $"{query}%") ? 0 : 1)
            .ThenByDescending(m => m.ImdbRating)
            .Take(5)
            .Select(m => new SearchMovieResult(
                m.Id,
                m.Title,
                m.Slug,
                m.PosterUrl,
                m.Certificate,
                m.Category.ToString(),
                m.ImdbRating))
            .ToListAsync(ct);

        var events = await _db.Events
            .Where(e => e.DeletedAt == null
                     && e.Status == MovieStatus.Published
                     && EF.Functions.ILike(e.Title, $"%{query}%"))
            .OrderBy(e => EF.Functions.ILike(e.Title, $"{query}%") ? 0 : 1)
            .ThenBy(e => e.EventDate)
            .Take(5)
            .Select(e => new SearchEventResult(
                e.Id,
                e.Title,
                e.Slug,
                e.PosterUrl,
                e.Type.ToString(),
                e.EventDate != null ? e.EventDate.Value.ToString("ddd, dd MMM yyyy") : null))
            .ToListAsync(ct);

        var venueQuery = _db.Venues
            .Where(v => v.DeletedAt == null
                     && v.IsActive
                     && (EF.Functions.ILike(v.Name, $"%{query}%")
                         || (v.Chain != null && EF.Functions.ILike(v.Chain, $"%{query}%"))));

        if (cityId.HasValue)
            venueQuery = venueQuery.Where(v => v.CityId == cityId.Value);

        var venues = await venueQuery
            .Take(3)
            .Join(_db.Cities,
                v => v.CityId,
                c => c.Id,
                (v, c) => new SearchVenueResult(v.Id, v.Name, v.Slug, v.Chain, c.Name))
            .ToListAsync(ct);

        var cities = await _db.Cities
            .Where(c => c.DeletedAt == null
                     && c.IsActive
                     && EF.Functions.ILike(c.Name, $"%{query}%"))
            .Take(3)
            .Select(c => new SearchCityResult(c.Id, c.Name, c.Slug, c.State, c.StateCode))
            .ToListAsync(ct);

        int total = movies.Count + events.Count + venues.Count + cities.Count;
        return new SearchResponse(movies, events, venues, cities, query, total);
    }
}
