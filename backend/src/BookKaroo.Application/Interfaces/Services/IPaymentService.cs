using BookKaroo.Application.DTOs.Booking;
using BookKaroo.Application.DTOs.Payment;

namespace BookKaroo.Application.Interfaces.Services;

public interface IPaymentService
{
    Task<CreateOrderResponse> CreateOrderAsync(
        CreateOrderRequest request,
        Guid               userId,
        CancellationToken  ct = default);

    Task<BookingDetailResponse> MockCaptureAsync(
        string            providerOrderId,
        Guid              userId,
        bool              simulateFailure,
        CancellationToken ct = default);

    Task<BookingDetailResponse> VerifyPaymentAsync(
        VerifyPaymentRequest request,
        CancellationToken    ct = default);
}
