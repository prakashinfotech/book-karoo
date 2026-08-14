using BookKaroo.Domain.Enums;

namespace BookKaroo.Domain.Entities;

public class Event : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public EventType Type { get; set; }
    public string? Description { get; set; }
    public Guid? VenueId { get; set; }
    public DateTime? EventDate { get; set; }
    public int DurationMin { get; set; }
    public string? Language { get; set; }
    public int? AgeRestriction { get; set; }
    public string? Organizer { get; set; }
    public string? Artists { get; set; }
    public string? PosterUrl { get; set; }
    public string? BackdropUrl { get; set; }
    public string? PriceTiers { get; set; }
    public string? VenueName      { get; set; }
    public string? CityName       { get; set; }
    public double? VenueLatitude  { get; set; }
    public double? VenueLongitude { get; set; }
    public MovieStatus Status { get; set; } = MovieStatus.Draft;
}
