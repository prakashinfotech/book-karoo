using BookKaroo.Application.DTOs.Admin;
using BookKaroo.Domain.Entities;

namespace BookKaroo.Application.Interfaces.Repositories;

public interface IBookingRepository : IRepository<Booking>
{
    Task<IEnumerable<Booking>> GetByUserAsync(Guid userId, CancellationToken ct = default);
    Task<Booking?> GetByRefAsync(string bookingRef, CancellationToken ct = default);
    Task<IEnumerable<Booking>> GetByShowAsync(Guid showId, CancellationToken ct = default);
    Task<bool>                 IsSeatBookedAsync(Guid showId, string seatLabel, CancellationToken ct = default);

    // Admin
    Task<(List<AdminBookingDto> Items, int Total)> GetAllAdminAsync(
        string?  search,
        string?  status,
        Guid?    movieId,
        Guid?    cityId,
        DateOnly? fromDate,
        DateOnly? toDate,
        int      page,
        int      pageSize,
        CancellationToken ct = default);

    Task<AdminBookingDto?> GetBookingDetailAdminAsync(string bookingRef, CancellationToken ct = default);

    Task<List<AdminBookingDto>> GetAllForReportAsync(
        DateOnly fromDate, DateOnly toDate,
        Guid? cityId, Guid? movieId, Guid? venueId,
        CancellationToken ct = default);

    Task<(Booking booking, decimal refundAmount, string? refundId)> AdminCancelBookingAsync(Guid bookingId, CancellationToken ct = default);

    Task<(string refundId, decimal refundAmount)> AdminProcessRefundAsync(Guid bookingId, decimal refundAmount, CancellationToken ct = default);
}
