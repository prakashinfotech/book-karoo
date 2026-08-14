namespace BookKaroo.Domain.Entities;

public class CmsBanner : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? LinkUrl { get; set; }
    public int Position { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
}
