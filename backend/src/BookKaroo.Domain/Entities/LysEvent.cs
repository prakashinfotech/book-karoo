namespace BookKaroo.Domain.Entities;

public class LysEvent : BaseEntity
{
    public Guid    OrganizerId         { get; set; }
    public string  Title               { get; set; } = string.Empty;
    public string  Slug                { get; set; } = string.Empty;
    public string  Type                { get; set; } = string.Empty;
    public string  Description         { get; set; } = string.Empty;
    public string  VenueType           { get; set; } = "custom";
    public Guid?   VenueId             { get; set; }
    public string? CustomVenueName      { get; set; }
    public string? CustomVenueAddress  { get; set; }
    public string? CustomVenueCity     { get; set; }
    public double? CustomVenueLatitude  { get; set; }
    public double? CustomVenueLongitude { get; set; }
    public DateTime EventDate          { get; set; }
    public int?    DurationMin         { get; set; }
    public string  Language            { get; set; } = "Hindi";
    public int     AgeRestriction      { get; set; }
    public string? ArtistsJson         { get; set; }
    public string? PosterUrl           { get; set; }
    public string? BackdropUrl         { get; set; }
    public string  PriceTiersJson      { get; set; } = "[]";
    public string  Status              { get; set; } = "draft";
    public DateTime? SubmittedAt       { get; set; }
    public DateTime? ReviewedAt        { get; set; }
    public Guid?   ReviewedBy          { get; set; }
    public string? ReviewNotes         { get; set; }
    public decimal CommissionRate      { get; set; } = 5.00m;
    public Guid?   PublishedEventId    { get; set; }

    // Partner approval flow
    public bool    RequiresPartnerApproval { get; set; } = false;
    public Guid?   AssignedPartnerId       { get; set; }
    public DateTime? PartnerReviewedAt    { get; set; }
    public Guid?   PartnerReviewedBy      { get; set; }
    public string? PartnerAction          { get; set; }
    public string? PartnerReviewNotes     { get; set; }
}
