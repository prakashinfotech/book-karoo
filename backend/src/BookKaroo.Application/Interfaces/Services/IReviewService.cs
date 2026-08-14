using BookKaroo.Application.DTOs.Reviews;

namespace BookKaroo.Application.Interfaces.Services;

public interface IReviewService
{
    Task<PaginatedReviewResponse> GetByMovieAsync(
        Guid movieId, string sort, int page, int pageSize, CancellationToken ct = default);

    Task<ReviewResponse> CreateAsync(
        Guid userId, Guid movieId, CreateReviewRequest req, CancellationToken ct = default);
}
