using BookKaroo.Domain.Entities;

namespace BookKaroo.Application.Interfaces.Repositories;

public interface ISeatLockRepository
{
    Task<IEnumerable<SeatLock>> GetActiveLocksAsync(Guid showId, CancellationToken ct = default);
    Task<SeatLock?>             GetActiveLockForSeatAsync(Guid showId, string seatLabel, CancellationToken ct = default);
    Task<SeatLock>              AddAsync(SeatLock seatLock, CancellationToken ct = default);
    Task                        DeleteAsync(Guid lockId, CancellationToken ct = default);
    Task                        DeleteByUserAndShowAsync(Guid userId, Guid showId, CancellationToken ct = default);
    Task<int>                   DeleteExpiredAsync(CancellationToken ct = default);
}
