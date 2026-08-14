namespace BookKaroo.Application.DTOs.Lys;

public class RegisterOrganizerRequest
{
    public string Name      { get; set; } = string.Empty;
    public string Email     { get; set; } = string.Empty;
    public string Phone     { get; set; } = string.Empty;
    public string PanNumber { get; set; } = string.Empty;
}

public class UpdateOrganizerRequest
{
    public string? Name  { get; set; }
    public string? Phone { get; set; }
}

public class CreateLysEventRequest
{
    public string  Title              { get; set; } = string.Empty;
    public string  Type               { get; set; } = string.Empty;
    public string  Description        { get; set; } = string.Empty;
    public string  VenueType          { get; set; } = "custom";
    public Guid?   VenueId            { get; set; }
    public string? CustomVenueName      { get; set; }
    public string? CustomVenueAddress  { get; set; }
    public string? CustomVenueCity     { get; set; }
    public double? CustomVenueLatitude  { get; set; }
    public double? CustomVenueLongitude { get; set; }
    public DateTime EventDate          { get; set; }
    public int?    DurationMin        { get; set; }
    public string  Language           { get; set; } = "Hindi";
    public int     AgeRestriction     { get; set; }
    public string? ArtistsJson        { get; set; }
    public string  PriceTiersJson     { get; set; } = "[]";
}

public class UpdateLysEventRequest
{
    public string?  Title              { get; set; }
    public string?  Type               { get; set; }
    public string?  Description        { get; set; }
    public string?  VenueType          { get; set; }
    public Guid?    VenueId            { get; set; }
    public string?  CustomVenueName      { get; set; }
    public string?  CustomVenueAddress  { get; set; }
    public string?  CustomVenueCity     { get; set; }
    public double?  CustomVenueLatitude  { get; set; }
    public double?  CustomVenueLongitude { get; set; }
    public DateTime? EventDate          { get; set; }
    public int?     DurationMin        { get; set; }
    public string?  Language           { get; set; }
    public int?     AgeRestriction     { get; set; }
    public string?  ArtistsJson        { get; set; }
    public string?  PriceTiersJson     { get; set; }
}

public class AdminReviewRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class AdminChangesRequest
{
    public string Notes { get; set; } = string.Empty;
}

public class LysUploadResult
{
    public string PublicUrl      { get; set; } = string.Empty;
    public string StoragePath    { get; set; } = string.Empty;
    public long   FileSizeBytes  { get; set; }
}

public class LysDuplicateWarning
{
    public Guid   Id             { get; set; }
    public string Title          { get; set; } = string.Empty;
    public string EventDateLabel { get; set; } = string.Empty;
    public string Status         { get; set; } = string.Empty;
}
