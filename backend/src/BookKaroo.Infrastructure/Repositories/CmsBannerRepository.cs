using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Domain.Entities;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Repositories;

public class CmsBannerRepository : Repository<CmsBanner>, ICmsBannerRepository
{
    public CmsBannerRepository(BookKarooDbContext db) : base(db) { }

    public async Task<IEnumerable<CmsBanner>> GetActiveAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;

        return await _db.CmsBanners
            .Where(b => b.DeletedAt == null
                     && b.IsActive
                     && (b.StartsAt == null || b.StartsAt <= now)
                     && (b.EndsAt   == null || b.EndsAt   >= now))
            .OrderBy(b => b.Position)
            .ToListAsync(ct);
    }

    public async Task<List<CmsBanner>> GetAllAdminAsync(CancellationToken ct = default) =>
        await _db.CmsBanners
            .Where(b => b.DeletedAt == null)
            .OrderBy(b => b.Position)
            .ToListAsync(ct);

    public async Task UpdatePositionAsync(Guid id, int position, CancellationToken ct = default)
    {
        var banner = await _db.CmsBanners.FindAsync([id], ct);
        if (banner == null) return;
        banner.Position  = position;
        banner.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task ToggleActiveAsync(Guid id, bool isActive, CancellationToken ct = default)
    {
        var banner = await _db.CmsBanners.FindAsync([id], ct);
        if (banner == null) return;
        banner.IsActive  = isActive;
        banner.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
