namespace BookKaroo.Domain.Entities;

public class PartnerProfile : BaseEntity
{
    public Guid    UserId        { get; set; }
    public string  BusinessName  { get; set; } = string.Empty;
    public string  ContactPerson { get; set; } = string.Empty;
    public string  ContactPhone  { get; set; } = string.Empty;
    public string  ContactEmail  { get; set; } = string.Empty;
    public string? GstNumber     { get; set; }
    public string? PanNumber     { get; set; }
    public string? BankAccount   { get; set; }
    public string? IfscCode      { get; set; }
    public bool    IsActive      { get; set; } = true;
    public string? Notes         { get; set; }
    public Guid?   CreatedBy     { get; set; }
}
