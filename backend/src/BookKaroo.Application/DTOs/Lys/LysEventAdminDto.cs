namespace BookKaroo.Application.DTOs.Lys;

public class LysEventAdminDto
{
    public Guid    Id                   { get; set; }
    public string  Title                { get; set; } = string.Empty;
    public string  Slug                 { get; set; } = string.Empty;
    public string  Type                 { get; set; } = string.Empty;
    public string  Status               { get; set; } = string.Empty;
    public string  OrganizerName        { get; set; } = string.Empty;
    public string  OrganizerEmail       { get; set; } = string.Empty;
    public string  OrganizerPan         { get; set; } = string.Empty;
    public bool    IsOrganizerVerified  { get; set; }
    public string  VenueType            { get; set; } = "custom";
    public string  VenueDisplay         { get; set; } = string.Empty;
    public string? CustomVenueAddress    { get; set; }
    public double? CustomVenueLatitude   { get; set; }
    public double? CustomVenueLongitude  { get; set; }
    public string  EventDateLabel       { get; set; } = string.Empty;
    public string  EventTimeLabel       { get; set; } = string.Empty;
    public string? Description          { get; set; }
    public string  Language             { get; set; } = string.Empty;
    public int     AgeRestriction       { get; set; }
    public int?    DurationMin          { get; set; }
    public decimal CommissionRate       { get; set; }
    public decimal LowestPrice          { get; set; }
    public int     TierCount            { get; set; }
    public List<LysPriceTierDto> PriceTiers { get; set; } = [];
    public List<LysArtistDto>    Artists    { get; set; } = [];
    public string? PosterUrl            { get; set; }
    public string? BackdropUrl          { get; set; }
    public DateTime? SubmittedAt        { get; set; }
    public DateTime? ReviewedAt         { get; set; }
    public string? ReviewNotes          { get; set; }

    // Partner approval fields
    public bool      RequiresPartnerApproval { get; set; }
    public string?   AssignedPartnerName     { get; set; }
    public string?   PartnerAction           { get; set; }
    public string?   PartnerReviewNotes      { get; set; }
    public DateTime? PartnerReviewedAt       { get; set; }
}
