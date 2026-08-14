namespace BookKaroo.Application.DTOs.Lys;

public class LysPartnerEventDto
{
    public Guid    Id                  { get; set; }
    public string  Title               { get; set; } = string.Empty;
    public string  Slug                { get; set; } = string.Empty;
    public string  Type                { get; set; } = string.Empty;
    public string  Status              { get; set; } = string.Empty;
    public string  OrganizerName       { get; set; } = string.Empty;
    public string  OrganizerEmail      { get; set; } = string.Empty;
    public string  VenueDisplay        { get; set; } = string.Empty;
    public string  EventDateLabel      { get; set; } = string.Empty;
    public string  EventTimeLabel      { get; set; } = string.Empty;
    public string? Description         { get; set; }
    public string  Language            { get; set; } = string.Empty;
    public int     AgeRestriction      { get; set; }
    public int?    DurationMin         { get; set; }
    public decimal LowestPrice         { get; set; }
    public int     TierCount           { get; set; }
    public List<LysPriceTierDto> PriceTiers { get; set; } = [];
    public List<LysArtistDto>    Artists    { get; set; } = [];
    public string? PosterUrl           { get; set; }
    public string? BackdropUrl         { get; set; }
    public DateTime? SubmittedAt       { get; set; }

    // Partner review state
    public string? PartnerAction       { get; set; }
    public string? PartnerReviewNotes  { get; set; }
    public DateTime? PartnerReviewedAt { get; set; }
}
