using BookKaroo.Application.DTOs.Shows;

namespace BookKaroo.Application.Interfaces.Services;

public interface ISeatLockService
{
    Task<SeatLockResponse> LockSeatsAsync(Guid userId, Guid showId, string[] seats, CancellationToken ct = default);
    Task                   ReleaseLocksAsync(Guid userId, Guid showId, CancellationToken ct = default);
    Task<int>              SweepExpiredAsync(CancellationToken ct = default);
}
