using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Domain.Entities;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Repositories;

public class CityRepository : Repository<City>, ICityRepository
{
    public CityRepository(BookKarooDbContext db) : base(db) { }

    public async Task<City?> FindByNameAsync(string name, CancellationToken ct = default) =>
        await _db.Cities.FirstOrDefaultAsync(
            c => c.Name.ToLower() == name.ToLower() && c.IsActive, ct);

    public async Task<IEnumerable<City>> GetActiveAsync(CancellationToken ct = default) =>
        await _db.Cities.Where(c => c.IsActive).ToListAsync(ct);
}
