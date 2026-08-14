using BookKaroo.Application.DTOs.Reviews;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Enums;

namespace BookKaroo.Application.Services;

public class ReviewService : IReviewService
{
    private readonly IReviewRepository _reviews;
    private readonly IUserRepository   _users;

    public ReviewService(IReviewRepository reviews, IUserRepository users)
    {
        _reviews = reviews;
        _users   = users;
    }

    public async Task<PaginatedReviewResponse> GetByMovieAsync(
        Guid movieId, string sort, int page, int pageSize, CancellationToken ct = default)
    {
        var (items, total) = await _reviews.GetByMovieAsync(movieId, sort, page, pageSize, ct);

        // Batch-resolve user names (at most pageSize distinct users)
        var userCache = new Dictionary<Guid, string>();
        foreach (var review in items)
        {
            if (!userCache.ContainsKey(review.UserId))
            {
                var user = await _users.GetByIdAsync(review.UserId, ct);
                userCache[review.UserId] = user?.Name ?? "Anonymous";
            }
        }

        var dtos = items.Select(r =>
        {
            var name = userCache.GetValueOrDefault(r.UserId, "Anonymous");
            return new ReviewResponse(
                r.Id, r.UserId, name,
                name.Length > 0 ? name[0].ToString().ToUpper() : "?",
                r.Rating, r.Title, r.Body,
                r.ThumbsUp, r.ThumbsDown,
                r.IsVerifiedBooking, r.CreatedAt, r.Status.ToString());
        });

        var totalPages = pageSize == 0 ? 0 : (int)Math.Ceiling((double)total / pageSize);
        return new PaginatedReviewResponse(dtos, total, page, pageSize, totalPages);
    }

    public async Task<ReviewResponse> CreateAsync(
        Guid userId, Guid movieId, CreateReviewRequest req, CancellationToken ct = default)
    {
        if (!await _reviews.HasUserBookedMovieAsync(userId, movieId, ct))
            throw new ForbiddenException("Book this movie before writing a review.");

        if (await _reviews.HasUserReviewedAsync(userId, movieId, ct))
            throw new ConflictException("You have already reviewed this movie.");

        var review = new Domain.Entities.Review
        {
            UserId           = userId,
            MovieId          = movieId,
            Rating           = req.Rating,
            Title            = req.Title?.Trim(),
            Body             = req.Body?.Trim(),
            IsVerifiedBooking = true,
            Status           = ReviewStatus.Published
        };

        await _reviews.AddAsync(review, ct);

        var user = await _users.GetByIdAsync(userId, ct);
        var name = user?.Name ?? "Anonymous";
        return new ReviewResponse(
            review.Id, userId, name,
            name.Length > 0 ? name[0].ToString().ToUpper() : "?",
            review.Rating, review.Title, review.Body,
            0, 0, true, review.CreatedAt, review.Status.ToString());
    }
}
