using BookKaroo.Domain.Entities;

namespace BookKaroo.Application.Interfaces.Repositories;

public interface IReviewRepository : IRepository<Review>
{
    Task<(IEnumerable<Review> Items, int Total)> GetByMovieAsync(
        Guid movieId, string sort, int page, int pageSize, CancellationToken ct = default);

    Task<decimal>              GetAverageRatingAsync(Guid movieId, CancellationToken ct = default);
    Task<Dictionary<int, int>> GetRatingDistributionAsync(Guid movieId, CancellationToken ct = default);
    Task<bool>                 HasUserBookedMovieAsync(Guid userId, Guid movieId, CancellationToken ct = default);
    Task<bool>                 HasUserReviewedAsync(Guid userId, Guid movieId, CancellationToken ct = default);
}
