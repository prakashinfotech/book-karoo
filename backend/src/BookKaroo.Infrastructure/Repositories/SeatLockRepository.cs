using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Domain.Entities;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Repositories;

public class SeatLockRepository : ISeatLockRepository
{
    private readonly BookKarooDbContext _db;
    public SeatLockRepository(BookKarooDbContext db) => _db = db;

    public async Task<IEnumerable<SeatLock>> GetActiveLocksAsync(Guid showId, CancellationToken ct = default) =>
        await _db.SeatLocks
            .Where(s => s.ShowId == showId && s.ExpiresAt > DateTime.UtcNow)
            .ToListAsync(ct);

    public async Task<SeatLock?> GetActiveLockForSeatAsync(Guid showId, string seatLabel, CancellationToken ct = default) =>
        await _db.SeatLocks
            .Where(s => s.ShowId == showId && s.SeatLabel == seatLabel && s.ExpiresAt > DateTime.UtcNow)
            .FirstOrDefaultAsync(ct);

    public async Task<SeatLock> AddAsync(SeatLock seatLock, CancellationToken ct = default)
    {
        await _db.SeatLocks.AddAsync(seatLock, ct);
        await _db.SaveChangesAsync(ct);
        return seatLock;
    }

    public async Task DeleteAsync(Guid lockId, CancellationToken ct = default)
    {
        var entity = await _db.SeatLocks.FindAsync([lockId], ct);
        if (entity is not null)
        {
            _db.SeatLocks.Remove(entity);
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task DeleteByUserAndShowAsync(Guid userId, Guid showId, CancellationToken ct = default)
    {
        var locks = await _db.SeatLocks
            .Where(s => s.UserId == userId && s.ShowId == showId)
            .ToListAsync(ct);

        if (locks.Count > 0)
        {
            _db.SeatLocks.RemoveRange(locks);
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task<int> DeleteExpiredAsync(CancellationToken ct = default)
    {
        var expired = await _db.SeatLocks
            .Where(s => s.ExpiresAt <= DateTime.UtcNow)
            .ToListAsync(ct);

        if (expired.Count == 0) return 0;

        _db.SeatLocks.RemoveRange(expired);
        await _db.SaveChangesAsync(ct);
        return expired.Count;
    }
}
