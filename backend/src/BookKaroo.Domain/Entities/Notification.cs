namespace BookKaroo.Domain.Entities;

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? Data { get; set; }
    public bool IsRead { get; set; }
    public string[] SentVia { get; set; } = [];
}
