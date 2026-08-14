using BookKaroo.Domain.Entities;

namespace BookKaroo.Application.Interfaces.Repositories;

public interface ICmsBannerRepository : IRepository<CmsBanner>
{
    Task<IEnumerable<CmsBanner>> GetActiveAsync(CancellationToken ct = default);
    Task<List<CmsBanner>> GetAllAdminAsync(CancellationToken ct = default);
    Task UpdatePositionAsync(Guid id, int position, CancellationToken ct = default);
    Task ToggleActiveAsync(Guid id, bool isActive, CancellationToken ct = default);
}
