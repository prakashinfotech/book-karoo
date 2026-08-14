namespace BookKaroo.Domain.Entities;

public class EventTicketLock
{
    public Guid     Id        { get; set; } = Guid.NewGuid();
    public Guid     EventId   { get; set; }
    public string   TierName  { get; set; } = string.Empty;
    public int      Quantity  { get; set; }
    public Guid?    UserId    { get; set; }
    public string?  SessionId { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
