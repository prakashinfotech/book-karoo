namespace BookKaroo.Domain.Entities;

public class SeatLock
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ShowId { get; set; }
    public string SeatLabel { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public string? SessionId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
}
