using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Repositories;

public class ScreenRepository : Repository<Screen>, IScreenRepository
{
    public ScreenRepository(BookKarooDbContext db) : base(db) { }

    public async Task<List<Screen>> GetByVenueAsync(Guid venueId, CancellationToken ct = default) =>
        await _db.Screens
            .Where(s => s.VenueId == venueId)
            .OrderBy(s => s.Name)
            .ToListAsync(ct);

    public async Task ScreenDeleteAsync(Guid screenId, CancellationToken ct = default)
    {
        var activeShows = await _db.Shows
            .CountAsync(s => s.ScreenId == screenId
                          && s.Status == ShowStatus.Scheduled
                          && s.ShowDatetime > DateTime.UtcNow, ct);

        if (activeShows > 0)
            throw new InvalidOperationException(
                "Cannot delete screen with active upcoming shows. Cancel shows first.");

        var screen = await _db.Screens.FirstOrDefaultAsync(s => s.Id == screenId, ct);
        if (screen == null) return;

        screen.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
