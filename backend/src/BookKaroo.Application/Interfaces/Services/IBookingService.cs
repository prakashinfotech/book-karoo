using BookKaroo.Application.DTOs.Booking;
using BookKaroo.Application.DTOs.Events;
using BookKaroo.Application.DTOs.Payment;

namespace BookKaroo.Application.Interfaces.Services;

public interface IBookingService
{
    Task<BookingDetailResponse> FinalizeBookingAsync(
        Guid bookingId, string providerPaymentId, CancellationToken ct = default);

    Task<BookingDetailResponse> GetByRefAsync(
        string bookingRef, Guid userId, CancellationToken ct = default);

    Task<PaginatedBookings> GetByUserAsync(
        Guid userId, string? tab, int page, int pageSize, CancellationToken ct = default);

    Task<CancelResponse> CancelAsync(
        string bookingRef, Guid userId, CancellationToken ct = default);

    /// <summary>Create a Razorpay/mock order for an event booking (no seat grid).</summary>
    Task<CreateOrderResponse> CreateEventOrderAsync(
        CreateEventOrderRequest req, Guid userId, CancellationToken ct = default);

    /// <summary>Finalize an event booking after payment capture.</summary>
    Task<BookingDetailResponse> FinalizeEventBookingAsync(
        Guid bookingId, string providerPaymentId, CancellationToken ct = default);

    /// <summary>Generate the GST invoice PDF bytes for a booking on demand.</summary>
    Task<byte[]> GenerateInvoicePdfAsync(
        string bookingRef, Guid userId, CancellationToken ct = default);
}
