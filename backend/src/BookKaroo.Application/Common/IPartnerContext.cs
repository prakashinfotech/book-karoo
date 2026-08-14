namespace BookKaroo.Application.Common;

public interface IPartnerContext
{
    Guid UserId { get; }
    Guid PartnerId { get; }
    IReadOnlyList<Guid> VenueIds { get; }
    void EnsureVenueAccess(Guid venueId);
}
