using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Application.Services;
using BookKaroo.Domain.Entities;
using BookKaroo.Infrastructure.Data;
using BookKaroo.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BookKaroo.Infrastructure.Services;

public class NotificationService : INotificationService
{
    private readonly BookKarooDbContext          _db;
    private readonly IUserRepository             _users;
    private readonly IShowRepository             _shows;
    private readonly IMovieRepository            _movies;
    private readonly IRepository<Venue>          _venues;
    private readonly IRepository<Screen>         _screens;
    private readonly IEmailService               _email;
    private readonly InvoiceBuilder              _invoiceBuilder;
    private readonly IInvoicePdfGenerator        _pdfGenerator;
    private readonly SupabaseStorageService      _storage;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        BookKarooDbContext           db,
        IUserRepository              users,
        IShowRepository              shows,
        IMovieRepository             movies,
        IRepository<Venue>           venues,
        IRepository<Screen>          screens,
        IEmailService                email,
        InvoiceBuilder               invoiceBuilder,
        IInvoicePdfGenerator         pdfGenerator,
        SupabaseStorageService       storage,
        ILogger<NotificationService> logger)
    {
        _db             = db;
        _users          = users;
        _shows          = shows;
        _movies         = movies;
        _venues         = venues;
        _screens        = screens;
        _email          = email;
        _invoiceBuilder = invoiceBuilder;
        _pdfGenerator   = pdfGenerator;
        _storage        = storage;
        _logger         = logger;
    }

    public async Task SendBookingConfirmedAsync(Guid bookingId, CancellationToken ct = default)
    {
        _logger.LogInformation("Sending booking confirmation for BookingId={BookingId}", bookingId);

        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId, ct);
        if (booking is null)
        {
            _logger.LogWarning("Booking {BookingId} not found for notification", bookingId);
            return;
        }

        var user       = await _users.GetByIdAsync(booking.UserId, ct);
        var show       = booking.ShowId.HasValue ? await _shows.GetByIdAsync(booking.ShowId.Value, ct) : null;
        var movie      = show?.MovieId.HasValue == true ? await _movies.GetByIdAsync(show.MovieId!.Value, ct) : null;
        var allVenues  = await _venues.GetAllAsync(ct);
        var venue      = show is not null ? allVenues.FirstOrDefault(v => v.Id == show.VenueId) : null;
        var allScreens = await _screens.GetAllAsync(ct);
        var screen     = show is not null ? allScreens.FirstOrDefault(s => s.Id == show.ScreenId) : null;
        var payment    = await _db.Payments.FirstOrDefaultAsync(p => p.BookingId == bookingId, ct);

        // For event bookings: load event to get actual date + time + title + venue
        DateTime? eventDate  = null;
        string?   eventTitle = null;
        if (booking.EventId.HasValue)
        {
            var ev = await _db.Events.FirstOrDefaultAsync(e => e.Id == booking.EventId.Value, ct);
            if (ev is not null)
            {
                eventDate  = ev.EventDate;
                eventTitle = ev.Title;
                // Use event venue for the invoice if no show venue
                if (venue is null && ev.VenueId.HasValue)
                    venue = allVenues.FirstOrDefault(v => v.Id == ev.VenueId.Value);
            }
        }

        if (user is null)
        {
            _logger.LogWarning("User not found for booking {Ref}", booking.BookingRef);
            return;
        }
        // For event bookings, show may be null — allow proceeding without show
        if (show is null && booking.ShowId.HasValue)
        {
            _logger.LogWarning("Show not found for booking {Ref}", booking.BookingRef);
            return;
        }

        try
        {
            // Build GST invoice — pass event details so event bookings show real title/date
            var invoiceModel = await _invoiceBuilder.BuildAsync(booking, show, movie, venue, payment, user, ct,
                eventTitle, eventDate);
            var pdfBytes     = _pdfGenerator.Generate(invoiceModel);

            // QR URL for email — use Supabase URL if available, otherwise public QR API
            // (data: URIs are stripped by Gmail / Outlook, so we need a real HTTPS URL)
            string? qrUrl = booking.QrUrl;
            if (string.IsNullOrEmpty(qrUrl))
            {
                var encoded = Uri.EscapeDataString(booking.BookingRef);
                qrUrl = $"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={encoded}&format=png&qzone=1";
            }

            // Upload PDF to Supabase Storage (best-effort — does not block email)
            try
            {
                var invoiceUrl = await _storage.UploadInvoiceAsync(booking.UserId, booking.BookingRef, pdfBytes, ct);
                if (invoiceUrl is not null && booking.InvoiceUrl is null)
                {
                    booking.InvoiceUrl = invoiceUrl;
                    await _db.SaveChangesAsync(ct);
                    _logger.LogInformation("Invoice uploaded to {Url}", invoiceUrl);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Invoice upload failed for {Ref} — email will still be sent", booking.BookingRef);
            }

            // Resolve venue/screen names for email
            var emailVenueName  = venue?.Name;
            var emailScreenName = screen?.Name ?? (booking.TierName is not null ? booking.TierName : null);

            // Send email with PDF attached and QR as a real HTTPS URL
            await _email.SendBookingConfirmationAsync(booking, show, movie, user, pdfBytes, qrUrl, ct, eventDate, eventTitle,
                emailVenueName, emailScreenName);
            _logger.LogInformation("Booking confirmation email sent for {Ref} to {Email}", booking.BookingRef, user.Email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send booking confirmation for {Ref}", booking.BookingRef);
        }
    }

    public async Task SendBookingCancelledAsync(Guid bookingId, decimal refundAmount, CancellationToken ct = default)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId, ct);
        if (booking is null) return;

        var user = await _users.GetByIdAsync(booking.UserId, ct);
        if (user is null) return;

        _logger.LogInformation("Sending cancellation notification for {Ref}", booking.BookingRef);

        // Enrich with show / event details for the email template
        string?   contentTitle = null;
        string?   venueAndCity = null;
        DateTime? showDateTime = null;

        if (booking.ShowId.HasValue)
        {
            var show  = await _shows.GetByIdAsync(booking.ShowId.Value, ct);
            var movie = show?.MovieId.HasValue == true
                ? await _movies.GetByIdAsync(show.MovieId!.Value, ct)
                : null;
            var allVenues = await _db.Venues.ToListAsync(ct);
            var venue     = show is not null ? allVenues.FirstOrDefault(v => v.Id == show.VenueId) : null;

            contentTitle = movie?.Title;
            if (venue is not null)
                venueAndCity = venue.Name;
            if (show is not null)
                showDateTime = show.ShowDatetime;
        }
        else if (booking.EventId.HasValue)
        {
            var ev = await _db.Events.FirstOrDefaultAsync(e => e.Id == booking.EventId.Value, ct);
            if (ev is not null)
            {
                contentTitle = ev.Title;
                showDateTime = ev.EventDate;
                if (ev.VenueId.HasValue)
                {
                    var evVenue = await _db.Venues.FirstOrDefaultAsync(v => v.Id == ev.VenueId.Value, ct);
                    venueAndCity = evVenue?.Name;
                }
            }
        }

        try
        {
            await _email.SendBookingCancelledAsync(booking, user, refundAmount, ct,
                contentTitle, venueAndCity, showDateTime);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send cancellation email for {Ref}", booking.BookingRef);
        }
    }
}
