namespace BookKaroo.Application.DTOs.Lys;

public class LysEventResponse
{
    public Guid    Id                  { get; set; }
    public Guid    OrganizerId         { get; set; }
    public string  Title               { get; set; } = string.Empty;
    public string  Slug                { get; set; } = string.Empty;
    public string  Type                { get; set; } = string.Empty;
    public string  Description         { get; set; } = string.Empty;
    public string  VenueType           { get; set; } = "custom";
    public Guid?   VenueId             { get; set; }
    public string? VenueName           { get; set; }
    public string? CityName            { get; set; }
    public string? CustomVenueName      { get; set; }
    public string? CustomVenueAddress  { get; set; }
    public string? CustomVenueCity     { get; set; }
    public double? CustomVenueLatitude  { get; set; }
    public double? CustomVenueLongitude { get; set; }
    public DateTime EventDate          { get; set; }
    public string  EventDateLabel      { get; set; } = string.Empty;
    public string  EventTimeLabel      { get; set; } = string.Empty;
    public int?    DurationMin         { get; set; }
    public string  Language            { get; set; } = string.Empty;
    public int     AgeRestriction      { get; set; }
    public List<LysArtistDto> Artists  { get; set; } = [];
    public List<LysPriceTierDto> PriceTiers { get; set; } = [];
    public decimal LowestPrice         { get; set; }
    public string? PosterUrl           { get; set; }
    public string? BackdropUrl         { get; set; }
    public string  Status              { get; set; } = string.Empty;
    public string  StatusLabel         { get; set; } = string.Empty;
    public string  StatusColor         { get; set; } = string.Empty;
    public DateTime? SubmittedAt       { get; set; }
    public DateTime? ReviewedAt        { get; set; }
    public string? ReviewNotes         { get; set; }
    public decimal CommissionRate      { get; set; }
    public Guid?   PublishedEventId    { get; set; }
    public DateTime CreatedAt          { get; set; }
    public DateTime UpdatedAt          { get; set; }
}

public class LysArtistDto
{
    public string  Name { get; set; } = string.Empty;
    public string  Type { get; set; } = string.Empty;
    public string? Bio  { get; set; }
}

public class LysPriceTierDto
{
    public string  Name     { get; set; } = string.Empty;
    public decimal Price    { get; set; }
    public int     Capacity { get; set; }
    public string  Color    { get; set; } = string.Empty;
}
