namespace BookKaroo.Domain.Entities;

public class LysOrganizer : BaseEntity
{
    public Guid    UserId      { get; set; }
    public string  Name        { get; set; } = string.Empty;
    public string  Email       { get; set; } = string.Empty;
    public string  Phone       { get; set; } = string.Empty;
    public string  PanNumber   { get; set; } = string.Empty;
    public bool    IsVerified  { get; set; }
    public bool    IsActive    { get; set; } = true;
    public DateTime? VerifiedAt { get; set; }
    public Guid?   VerifiedBy  { get; set; }
    public string? Notes       { get; set; }
}
