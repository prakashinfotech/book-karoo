using BookKaroo.Domain.Enums;

namespace BookKaroo.Domain.Entities;

public class Show : BaseEntity
{
    public Guid ScreenId { get; set; }
    public Guid VenueId { get; set; }
    public Guid? MovieId { get; set; }
    public Guid? EventId { get; set; }
    public DateOnly ShowDate { get; set; }
    public TimeOnly ShowTime { get; set; }
    public DateTime ShowDatetime { get; set; }
    public string? Format { get; set; }
    public string? Language { get; set; }
    public string? PriceOverrides { get; set; }
    public ShowStatus Status { get; set; } = ShowStatus.Scheduled;
}
