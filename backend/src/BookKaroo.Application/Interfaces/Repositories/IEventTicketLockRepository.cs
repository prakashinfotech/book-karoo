using BookKaroo.Application.DTOs.Events;
using BookKaroo.Domain.Entities;

namespace BookKaroo.Application.Interfaces.Repositories;

public interface IEventTicketLockRepository
{
    Task<int> GetTierBookedQuantityAsync(Guid eventId, string tierName, CancellationToken ct = default);
    Task<int> GetTierLockedQuantityAsync(Guid eventId, string tierName, CancellationToken ct = default);
    Task<Dictionary<string, TierAvailabilityDto>> GetTierAvailabilityAsync(Guid eventId, string priceTiersJson, CancellationToken ct = default);
    Task<EventTicketLock> LockTierAsync(Guid eventId, string tierName, int quantity, Guid userId, double lockMinutes, CancellationToken ct = default);
    Task ReleaseLocksForUserAsync(Guid userId, Guid eventId, CancellationToken ct = default);
    Task<int> DeleteExpiredLocksAsync(CancellationToken ct = default);
}
