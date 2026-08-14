namespace BookKaroo.Application.Interfaces.Services;

public interface INotificationService
{
    /// <summary>Send booking confirmation email with GST invoice PDF attached.</summary>
    Task SendBookingConfirmedAsync(Guid bookingId, CancellationToken ct = default);

    /// <summary>Send booking cancellation email with refund details.</summary>
    Task SendBookingCancelledAsync(Guid bookingId, decimal refundAmount, CancellationToken ct = default);
}
