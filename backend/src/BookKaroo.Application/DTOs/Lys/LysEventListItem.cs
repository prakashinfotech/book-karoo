namespace BookKaroo.Application.DTOs.Lys;

public class LysEventListItem
{
    public Guid    Id             { get; set; }
    public string  Title          { get; set; } = string.Empty;
    public string  Slug           { get; set; } = string.Empty;
    public string  Type           { get; set; } = string.Empty;
    public DateTime EventDate     { get; set; }
    public string  EventDateLabel { get; set; } = string.Empty;
    public string  Status         { get; set; } = string.Empty;
    public string  StatusLabel    { get; set; } = string.Empty;
    public string? PosterUrl      { get; set; }
    public decimal LowestPrice    { get; set; }
    public DateTime? SubmittedAt  { get; set; }
    public DateTime? ReviewedAt   { get; set; }
    public string? ReviewNotes    { get; set; }
}
