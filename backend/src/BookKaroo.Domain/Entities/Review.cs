using BookKaroo.Domain.Enums;

namespace BookKaroo.Domain.Entities;

public class Review : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid? MovieId { get; set; }
    public Guid? EventId { get; set; }
    public int Rating { get; set; }
    public string? Title { get; set; }
    public string? Body { get; set; }
    public int ThumbsUp { get; set; }
    public int ThumbsDown { get; set; }
    public bool IsVerifiedBooking { get; set; }
    public ReviewStatus Status { get; set; } = ReviewStatus.Published;
}
