namespace BookKaroo.Domain.Entities;

public class PartnerVenueAccess
{
    public Guid     Id         { get; set; } = Guid.NewGuid();
    public Guid     PartnerId  { get; set; }
    public Guid     VenueId    { get; set; }
    public Guid?    GrantedBy  { get; set; }
    public DateTime GrantedAt  { get; set; } = DateTime.UtcNow;
    public bool     IsActive   { get; set; } = true;
}
