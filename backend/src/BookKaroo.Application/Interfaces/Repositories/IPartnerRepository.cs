using BookKaroo.Domain.Entities;

namespace BookKaroo.Application.Interfaces.Repositories;

public interface IPartnerRepository
{
    Task<PartnerProfile?> GetByUserIdAsync(Guid userId, CancellationToken ct);
    Task<PartnerProfile?> GetByIdAsync(Guid partnerId, CancellationToken ct);
    Task<List<Guid>> GetVenueIdsAsync(Guid partnerId, CancellationToken ct);
    Task<List<PartnerVenueAccess>> GetVenueAccessAsync(Guid partnerId, CancellationToken ct);
    Task<PartnerProfile> AddAsync(PartnerProfile profile, CancellationToken ct);
    Task UpdateAsync(PartnerProfile profile, CancellationToken ct);
    Task AddVenueAccessAsync(PartnerVenueAccess access, CancellationToken ct);
    Task SetVenueAccessActiveAsync(Guid partnerId, Guid venueId, bool isActive, CancellationToken ct);
    Task<(List<PartnerWithVenues> Items, int Total)> GetAllAdminAsync(
        string? search, bool? isActive, int page, int pageSize, CancellationToken ct);
}

public record PartnerWithVenues(
    PartnerProfile Profile,
    string UserName,
    string UserEmail,
    string? UserMobile,
    List<PartnerVenueInfo> Venues
);

public record PartnerVenueInfo(Guid VenueId, string VenueName, string CityName, DateTime GrantedAt, string? ContactPhone, string? ContactEmail);
