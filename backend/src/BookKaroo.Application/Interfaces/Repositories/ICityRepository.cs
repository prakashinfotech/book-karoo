using BookKaroo.Domain.Entities;

namespace BookKaroo.Application.Interfaces.Repositories;

public interface ICityRepository : IRepository<City>
{
    Task<City?> FindByNameAsync(string name, CancellationToken ct = default);
    Task<IEnumerable<City>> GetActiveAsync(CancellationToken ct = default);
}
