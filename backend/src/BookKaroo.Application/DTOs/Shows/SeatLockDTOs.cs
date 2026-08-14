namespace BookKaroo.Application.DTOs.Shows;

public record LockSeatsRequest(Guid ShowId, string[] Seats);

public record SeatLockResponse(
    Guid     LockId,
    DateTime ExpiresAt,
    string[] LockedSeats
);
