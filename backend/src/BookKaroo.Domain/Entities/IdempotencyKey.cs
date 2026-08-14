namespace BookKaroo.Domain.Entities;

public class IdempotencyKey
{
    public string Key { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public string Endpoint { get; set; } = string.Empty;
    public string? Response { get; set; }
    public int StatusCode { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
