using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Repositories;

public class ReviewRepository : Repository<Review>, IReviewRepository
{
    public ReviewRepository(BookKarooDbContext db) : base(db) { }

    public async Task<(IEnumerable<Review> Items, int Total)> GetByMovieAsync(
        Guid movieId, string sort, int page, int pageSize, CancellationToken ct = default)
    {
        var query = _db.Reviews.Where(r => r.MovieId == movieId && r.Status == ReviewStatus.Published);

        query = sort switch
        {
            "helpful" => query.OrderByDescending(r => r.ThumbsUp),
            "highest" => query.OrderByDescending(r => r.Rating),
            "lowest"  => query.OrderBy(r => r.Rating),
            _         => query.OrderByDescending(r => r.CreatedAt) // recent (default)
        };

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public async Task<decimal> GetAverageRatingAsync(Guid movieId, CancellationToken ct = default)
    {
        var avg = await _db.Reviews
            .Where(r => r.MovieId == movieId && r.Status == ReviewStatus.Published)
            .AverageAsync(r => (decimal?)r.Rating, ct);
        return Math.Round(avg ?? 0m, 1);
    }

    public async Task<Dictionary<int, int>> GetRatingDistributionAsync(Guid movieId, CancellationToken ct = default)
    {
        var groups = await _db.Reviews
            .Where(r => r.MovieId == movieId && r.Status == ReviewStatus.Published)
            .GroupBy(r => r.Rating)
            .Select(g => new { Rating = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        return Enumerable.Range(1, 10)
            .ToDictionary(r => r, r => groups.FirstOrDefault(g => g.Rating == r)?.Count ?? 0);
    }

    public async Task<bool> HasUserBookedMovieAsync(Guid userId, Guid movieId, CancellationToken ct = default) =>
        await (
            from b in _db.Bookings
            where b.UserId == userId && b.Status == BookingStatus.Confirmed
            join s in _db.Shows.Where(s => s.MovieId == movieId) on b.ShowId equals s.Id
            select b.Id
        ).AnyAsync(ct);

    public async Task<bool> HasUserReviewedAsync(Guid userId, Guid movieId, CancellationToken ct = default) =>
        await _db.Reviews.AnyAsync(r => r.UserId == userId && r.MovieId == movieId, ct);
}
