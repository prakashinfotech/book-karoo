using BookKaroo.Domain.Entities;

namespace BookKaroo.Application.Interfaces.Services;

public interface IEmailService
{
    Task SendBookingConfirmationAsync(
        Booking booking, Show? show, Movie? movie, User user,
        byte[] invoicePdf, string? qrUrl, CancellationToken ct = default,
        DateTime? eventDate = null, string? eventTitle = null,
        string? venueName = null, string? screenName = null);

    Task SendWelcomeAsync(User user, CancellationToken ct = default);

    Task SendPasswordResetAsync(User user, string token, CancellationToken ct = default);

    Task SendBookingCancelledAsync(
        Booking booking, User user, decimal refundAmount, CancellationToken ct = default,
        string? contentTitle = null, string? venueAndCity = null, DateTime? showDateTime = null);

    Task SendContactSupportAsync(
        string name, string email, string subject, string message,
        string? bookingRef, string supportEmail, CancellationToken ct = default);

    Task SendAccountDeletedAsync(User user, CancellationToken ct = default);

    Task SendMovieNowShowingAsync(User user, Movie movie, CancellationToken ct = default);

    Task SendLysOrganizerWelcomeAsync(string toEmail, string name, CancellationToken ct = default);
    Task SendLysSubmissionToAdminAsync(string adminEmail, string organizerName, string eventTitle, string eventType, DateTime eventDate, CancellationToken ct = default);
    Task SendLysApprovedAsync(string toEmail, string organizerName, string eventTitle, string eventSlug, string frontendUrl, CancellationToken ct = default);
    Task SendLysRejectedAsync(string toEmail, string organizerName, string eventTitle, string reason, CancellationToken ct = default);
    Task SendLysChangesRequestedAsync(string toEmail, string organizerName, string eventTitle, Guid eventId, string notes, string frontendUrl, CancellationToken ct = default);
    Task SendLysPartnerApprovalRequestAsync(string toEmail, string partnerName, string eventTitle, Guid eventId, string organizerName, string frontendUrl, CancellationToken ct = default);
    Task SendLysPartnerApprovedAsync(string toEmail, string organizerName, string eventTitle, CancellationToken ct = default);
    Task SendLysPartnerRejectedAsync(string toEmail, string organizerName, string eventTitle, string reason, CancellationToken ct = default);
}
