using BookKaroo.Domain.Entities;

namespace BookKaroo.Application.Interfaces.Repositories;

public interface IScreenRepository : IRepository<Screen>
{
    Task<List<Screen>> GetByVenueAsync(Guid venueId, CancellationToken ct = default);
    Task ScreenDeleteAsync(Guid screenId, CancellationToken ct = default);
}
