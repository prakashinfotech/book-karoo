using BookKaroo.Application.DTOs.Shows;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace BookKaroo.Application.Services;

public class SeatLockService : ISeatLockService
{
    private readonly ISeatLockRepository  _lockRepo;
    private readonly IBookingRepository   _bookingRepo;
    private readonly ISettingRepository   _settings;
    private readonly ILogger<SeatLockService> _logger;

    public SeatLockService(
        ISeatLockRepository      lockRepo,
        IBookingRepository       bookingRepo,
        ISettingRepository       settings,
        ILogger<SeatLockService> logger)
    {
        _lockRepo    = lockRepo;
        _bookingRepo = bookingRepo;
        _settings    = settings;
        _logger      = logger;
    }

    public async Task<SeatLockResponse> LockSeatsAsync(
        Guid userId, Guid showId, string[] seats, CancellationToken ct = default)
    {
        var minutesStr   = await _settings.GetAsync("seat_lock_minutes", ct);
        var lockMinutes  = double.TryParse(minutesStr, out var min) ? min : 8;
        var lockDuration = TimeSpan.FromMinutes(lockMinutes);

        // Load all active locks for this show in one round-trip
        var allShowLocks = (await _lockRepo.GetActiveLocksAsync(showId, ct)).ToList();
        var userLocks    = allShowLocks.Where(l => l.UserId == userId).ToList();
        var newSeatSet   = new HashSet<string>(seats);
        var userSeatSet  = new HashSet<string>(userLocks.Select(l => l.SeatLabel));

        // ── Delete ONLY the locks for seats the user just deselected ──────────
        // Each individual DELETE fires a Supabase Realtime DELETE event for that
        // specific row, so other users see exactly those seats unlock immediately
        // with no flicker on the seats that are still selected.
        foreach (var removed in userLocks.Where(l => !newSeatSet.Contains(l.SeatLabel)))
        {
            await _lockRepo.DeleteAsync(removed.Id, ct);
            _logger.LogInformation("Seat deselected {Seat}/{ShowId}/{UserId}",
                removed.SeatLabel, showId, userId);
        }

        // Single expiry timestamp for the whole batch (consistent countdown)
        var expiresAt = DateTime.UtcNow.Add(lockDuration);
        var newLocks  = new List<SeatLock>();

        foreach (var seat in seats)
        {
            // Seat still held by this user — reuse the existing lock row
            if (userSeatSet.Contains(seat))
            {
                newLocks.Add(userLocks.First(l => l.SeatLabel == seat));
                continue;
            }

            // Reject if already confirmed-booked
            var isBooked = await _bookingRepo.IsSeatBookedAsync(showId, seat, ct);
            if (isBooked)
                throw new ConflictException($"Seat {seat} is already booked.");

            // Reject if held by a different user
            var otherLock = allShowLocks.FirstOrDefault(l => l.SeatLabel == seat && l.UserId != userId);
            if (otherLock is not null)
                throw new ConflictException($"Seat {seat} is currently held by another user.");

            // Create fresh lock for this newly selected seat
            var seatLock = new SeatLock
            {
                Id        = Guid.NewGuid(),
                ShowId    = showId,
                SeatLabel = seat,
                UserId    = userId,
                ExpiresAt = expiresAt,
                CreatedAt = DateTime.UtcNow,
            };

            newLocks.Add(await _lockRepo.AddAsync(seatLock, ct));
            _logger.LogInformation("Seat locked {Seat}/{ShowId}/{UserId}", seat, showId, userId);
        }

        return new SeatLockResponse(newLocks[0].Id, expiresAt, seats);
    }

    public async Task ReleaseLocksAsync(Guid userId, Guid showId, CancellationToken ct = default)
    {
        await _lockRepo.DeleteByUserAndShowAsync(userId, showId, ct);
        _logger.LogInformation("Released all seat locks for show {ShowId} by user {UserId}", showId, userId);
    }

    public async Task<int> SweepExpiredAsync(CancellationToken ct = default)
    {
        var count = await _lockRepo.DeleteExpiredAsync(ct);
        if (count > 0)
            _logger.LogInformation("Swept {Count} expired seat locks", count);
        return count;
    }
}
