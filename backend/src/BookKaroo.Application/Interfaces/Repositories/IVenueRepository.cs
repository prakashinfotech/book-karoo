using BookKaroo.Application.DTOs.Admin;
using BookKaroo.Domain.Entities;

namespace BookKaroo.Application.Interfaces.Repositories;

public interface IVenueRepository : IRepository<Venue>
{
    Task<Venue?> FindBySlugAsync(string slug, CancellationToken ct = default);

    Task<(List<VenueAdminDto> Items, int Total)> GetAllAdminAsync(
        string? search, Guid? cityId, string? chain,
        int page, int pageSize, CancellationToken ct = default);

    Task<VenueWithScreensDto?> GetWithScreensAsync(Guid venueId, CancellationToken ct = default);

    Task VenueDeleteAsync(Guid id, CancellationToken ct = default);

    Task<Dictionary<Guid, string>> GetNamesByIdsAsync(IEnumerable<Guid> ids, CancellationToken ct = default);
}
