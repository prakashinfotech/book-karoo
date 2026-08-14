namespace BookKaroo.Application.DTOs.Reviews;

public record ReviewResponse(
    Guid     Id,
    Guid     UserId,
    string   UserName,
    string   UserAvatarInitial,
    int      Rating,
    string?  Title,
    string?  Body,
    int      ThumbsUp,
    int      ThumbsDown,
    bool     IsVerifiedBooking,
    DateTime CreatedAt,
    string   Status
);

public record PaginatedReviewResponse(
    IEnumerable<ReviewResponse> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages
);

public record CreateReviewRequest(
    int     Rating,
    string? Title = null,
    string? Body  = null
);
