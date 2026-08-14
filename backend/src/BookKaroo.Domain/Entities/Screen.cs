namespace BookKaroo.Domain.Entities;

public class Screen : BaseEntity
{
    public Guid VenueId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Layout { get; set; }
    public int TotalSeats { get; set; }
    public bool IsActive { get; set; } = true;
}
