using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BookKaroo.Infrastructure.Email;

public class ResendEmailService : IEmailService
{
    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _config;
    private readonly ILogger<ResendEmailService> _logger;

    public ResendEmailService(
        IHttpClientFactory http,
        IConfiguration config,
        ILogger<ResendEmailService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    public async Task SendBookingConfirmationAsync(
        Booking booking, Show? show, Movie? movie, User user,
        byte[] invoicePdf, string? qrUrl, CancellationToken ct = default,
        DateTime? eventDate = null, string? eventTitle = null,
        string? venueName = null, string? screenName = null)
    {
        var companyGstin  = _config["COMPANY_GSTIN"] ?? "24XXXXX0000X1Z5";
        var frontendUrl   = _config["FRONTEND_URL"] ?? "http://localhost:5173";
        var openTicketUrl = $"{frontendUrl}/booking/confirmed?ref={Uri.EscapeDataString(booking.BookingRef)}";

        var isEventBooking = booking.EventId.HasValue;
        var displayTitle   = isEventBooking
            ? (eventTitle ?? (booking.TierName is not null ? $"Event — {booking.TierName}" : "Event Ticket"))
            : (movie?.Title ?? "Movie");

        var html      = BuildBookingConfirmationHtml(booking, show, movie, user, openTicketUrl, companyGstin, qrUrl, eventDate, eventTitle, venueName, screenName);
        var plainText = BuildBookingConfirmationText(booking, show, displayTitle, user, openTicketUrl, eventDate, venueName, screenName);
        var pdfBase64 = Convert.ToBase64String(invoicePdf);

        await SendAsync(
            to:          user.Email,
            subject:     $"Your Tickets — {displayTitle} — {booking.BookingRef}",
            html:        html,
            text:        plainText,
            attachments: [new EmailAttachment($"{booking.BookingRef}_GST_Invoice.pdf", pdfBase64)],
            ct:          ct);
    }

    public async Task SendWelcomeAsync(User user, CancellationToken ct = default)
    {
        var frontendUrl = _config["FRONTEND_URL"] ?? "http://localhost:5173";
        var html = $"""
            <!DOCTYPE html>
            <html lang="en">
            <body style="margin:0;padding:0;background:#F4F4F5;font-family:sans-serif">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F4F4F5">
                <tr><td align="center" style="padding:24px 16px">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden">
                    <tr><td align="center" style="background:linear-gradient(135deg,#0A0E1A,#1A2138);padding:28px 24px">
                      <span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#FFF">Book<span style="color:#E11D74">Karoo</span></span>
                    </td></tr>
                    <tr><td style="padding:32px">
                      <h2 style="color:#18181B;margin:0 0 12px">Welcome to BookKaroo, {user.Name}! 🎬</h2>
                      <p style="color:#52525B;line-height:1.6">Book the moment. Karo it now. Discover movies, events, and shows in your city.</p>
                      <a href="{frontendUrl}/movies" style="display:inline-block;background:linear-gradient(135deg,#E11D74,#A855F7);color:#FFF;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
                        Explore Movies
                      </a>
                    </td></tr>
                    <tr><td align="center" style="background:#FAFAFA;padding:20px;color:#71717A;font-size:12px">
                      © 2026 BookKaroo Pvt Ltd. All rights reserved.
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;

        await SendAsync(user.Email, $"Welcome to BookKaroo, {user.Name}! 🎬", html, ct: ct);
    }

    public async Task SendPasswordResetAsync(User user, string token, CancellationToken ct = default)
    {
        var frontendUrl = _config["FRONTEND_URL"] ?? "http://localhost:5173";
        var resetUrl    = $"{frontendUrl}/reset-password?token={Uri.EscapeDataString(token)}";

        var html = $"""
            <!DOCTYPE html>
            <html lang="en">
            <body style="margin:0;padding:0;background:#F4F4F5;font-family:sans-serif">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F4F4F5">
                <tr><td align="center" style="padding:24px 16px">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden">
                    <tr><td align="center" style="background:linear-gradient(135deg,#0A0E1A,#1A2138);padding:28px 24px">
                      <span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#FFF">Book<span style="color:#E11D74">Karoo</span></span>
                    </td></tr>
                    <tr><td style="padding:32px">
                      <h2 style="color:#18181B;margin:0 0 12px">Reset your BookKaroo password</h2>
                      <p style="color:#52525B">We received a password reset request for <strong>{user.Email}</strong>. This link expires in 1 hour.</p>
                      <a href="{resetUrl}" style="display:inline-block;background:#E11D74;color:#FFF;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
                        Reset Password
                      </a>
                      <p style="color:#71717A;font-size:12px;margin-top:24px">If you didn't request this, you can safely ignore this email.</p>
                    </td></tr>
                    <tr><td align="center" style="background:#FAFAFA;padding:20px;color:#71717A;font-size:12px">
                      © 2026 BookKaroo Pvt Ltd. All rights reserved.
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;

        await SendAsync(user.Email, "Reset your BookKaroo password", html, ct: ct);
    }

    public async Task SendBookingCancelledAsync(
        Booking booking, User user, decimal refundAmount, CancellationToken ct = default,
        string? contentTitle = null, string? venueAndCity = null, DateTime? showDateTime = null)
    {
        var titleRow = contentTitle is not null
            ? $"""<tr style="border-bottom:1px solid #F4F4F5"><td style="padding:12px 16px;font-size:14px;color:#71717A">Event / Movie</td><td style="padding:12px 16px;font-size:14px;font-weight:600;color:#18181B">{contentTitle}</td></tr>"""
            : string.Empty;

        var venueRow = venueAndCity is not null
            ? $"""<tr style="border-bottom:1px solid #F4F4F5"><td style="padding:12px 16px;font-size:14px;color:#71717A">Venue</td><td style="padding:12px 16px;font-size:14px;font-weight:600;color:#18181B">{venueAndCity}</td></tr>"""
            : string.Empty;

        var dateRow = showDateTime.HasValue
            ? $"""<tr style="border-bottom:1px solid #F4F4F5"><td style="padding:12px 16px;font-size:14px;color:#71717A">Date &amp; Time</td><td style="padding:12px 16px;font-size:14px;font-weight:600;color:#18181B">{showDateTime.Value:ddd, dd MMM yyyy · hh:mm tt}</td></tr>"""
            : string.Empty;

        var refundRow = refundAmount > 0
            ? $"""<tr><td style="padding:12px 16px;font-size:14px;color:#71717A">Refund Amount</td><td style="padding:12px 16px;font-size:14px;font-weight:700;color:#10B981">₹{refundAmount:F2}</td></tr>"""
            : $"""<tr><td style="padding:12px 16px;font-size:14px;color:#71717A">Refund</td><td style="padding:12px 16px;font-size:14px;color:#71717A">Not applicable</td></tr>""";

        var refundNote = refundAmount > 0
            ? $"<p style=\"color:#52525B;margin-top:16px\">Your refund of <strong>₹{refundAmount:F2}</strong> will be credited to your original payment method within <strong>7 business days</strong>.</p>"
            : string.Empty;

        var html = $"""
            <!DOCTYPE html>
            <html lang="en">
            <body style="margin:0;padding:0;background:#F4F4F5;font-family:sans-serif">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F4F4F5">
                <tr><td align="center" style="padding:24px 16px">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;max-width:600px">
                    <tr><td align="center" style="background:linear-gradient(135deg,#0A0E1A,#1A2138);padding:28px 24px">
                      <span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#FFF">Book<span style="color:#E11D74">Karoo</span></span>
                      <p style="color:#A1A1AA;margin:6px 0 0;font-size:14px">Booking Cancellation Confirmation</p>
                    </td></tr>
                    <tr><td style="padding:32px">
                      <p style="color:#52525B;margin:0 0 20px">Hi <strong>{user.Name}</strong>, your booking has been successfully cancelled. Here's a summary:</p>

                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E4E4E7;border-radius:12px;overflow:hidden">
                        <tr style="background:#F9FAFB;border-bottom:1px solid #F4F4F5">
                          <td colspan="2" style="padding:12px 16px;font-size:12px;font-weight:700;color:#71717A;letter-spacing:.05em;text-transform:uppercase">Booking Details</td>
                        </tr>
                        <tr style="border-bottom:1px solid #F4F4F5">
                          <td style="padding:12px 16px;font-size:14px;color:#71717A">Booking Ref</td>
                          <td style="padding:12px 16px;font-size:14px;font-weight:700;font-family:monospace;color:#18181B">{booking.BookingRef}</td>
                        </tr>
                        {titleRow}
                        {venueRow}
                        {dateRow}
                        <tr style="background:#F9FAFB;border-top:1px solid #E4E4E7;border-bottom:1px solid #F4F4F5">
                          <td colspan="2" style="padding:12px 16px;font-size:12px;font-weight:700;color:#71717A;letter-spacing:.05em;text-transform:uppercase">Payment Summary</td>
                        </tr>
                        <tr style="border-bottom:1px solid #F4F4F5">
                          <td style="padding:12px 16px;font-size:14px;color:#71717A">Amount Paid</td>
                          <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#18181B">₹{booking.AmountPaid:F2}</td>
                        </tr>
                        {refundRow}
                      </table>

                      {refundNote}
                      <p style="color:#71717A;font-size:13px;margin-top:8px">Note: Convenience fees are non-refundable.</p>
                    </td></tr>
                    <tr><td align="center" style="background:#FAFAFA;padding:20px;color:#71717A;font-size:12px">
                      Need help? Contact us at <a href="mailto:support@bookkaroo.com" style="color:#6366F1">support@bookkaroo.com</a><br/>© 2026 BookKaroo Pvt Ltd. All rights reserved.
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;

        await SendAsync(
            to: user.Email,
            subject: $"Cancellation confirmed — {booking.BookingRef}",
            html: html,
            ct: ct);
    }

    public async Task SendContactSupportAsync(
        string name, string email, string subject, string message,
        string? bookingRef, string supportEmail, CancellationToken ct = default)
    {
        var refLine = string.IsNullOrWhiteSpace(bookingRef)
            ? string.Empty
            : $"\nBooking Reference: {bookingRef}";

        var text = $"""
            New support request from BookKaroo Help page

            Name: {name}
            Email: {email}
            Subject: {subject}{refLine}

            Message:
            {message}
            """;

        var html = $"""
            <!DOCTYPE html>
            <html lang="en">
            <body style="margin:0;padding:0;background:#F4F4F5;font-family:sans-serif">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F4F4F5">
                <tr><td align="center" style="padding:24px 16px">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden">
                    <tr><td align="center" style="background:linear-gradient(135deg,#0A0E1A,#1A2138);padding:28px 24px">
                      <span style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#FFF">Book<span style="color:#E11D74">Karoo</span></span>
                      <div style="color:#A1A1AA;font-size:13px;margin-top:6px">Support Request</div>
                    </td></tr>
                    <tr><td style="padding:32px">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E4E4E7;border-radius:12px;margin-bottom:20px">
                        <tr><td style="padding:12px 16px;border-bottom:1px solid #F4F4F5;font-size:13px;color:#71717A">Name</td><td style="padding:12px 16px;border-bottom:1px solid #F4F4F5;font-size:14px;font-weight:600;color:#18181B">{name}</td></tr>
                        <tr><td style="padding:12px 16px;border-bottom:1px solid #F4F4F5;font-size:13px;color:#71717A">Email</td><td style="padding:12px 16px;border-bottom:1px solid #F4F4F5;font-size:14px;color:#18181B">{email}</td></tr>
                        <tr><td style="padding:12px 16px;border-bottom:1px solid #F4F4F5;font-size:13px;color:#71717A">Subject</td><td style="padding:12px 16px;border-bottom:1px solid #F4F4F5;font-size:14px;color:#18181B">{subject}</td></tr>
                        {(string.IsNullOrWhiteSpace(bookingRef) ? "" : $"<tr><td style=\"padding:12px 16px;border-bottom:1px solid #F4F4F5;font-size:13px;color:#71717A\">Booking Ref</td><td style=\"padding:12px 16px;border-bottom:1px solid #F4F4F5;font-size:14px;font-family:monospace;color:#18181B\">{bookingRef}</td></tr>")}
                      </table>
                      <div style="background:#F9FAFB;border-radius:8px;padding:16px;border-left:3px solid #E11D74">
                        <div style="font-size:12px;font-weight:700;color:#71717A;letter-spacing:1px;margin-bottom:8px">MESSAGE</div>
                        <p style="color:#18181B;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap">{message}</p>
                      </div>
                    </td></tr>
                    <tr><td align="center" style="background:#FAFAFA;padding:20px;color:#71717A;font-size:12px">
                      © 2026 BookKaroo Pvt Ltd. All rights reserved.
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;

        await SendAsync(
            to: supportEmail,
            subject: $"[BookKaroo Support] {subject}",
            html: html,
            text: text,
            ct: ct);
    }

    public async Task SendMovieNowShowingAsync(User user, Movie movie, CancellationToken ct = default)
    {
        var frontendUrl = _config["FRONTEND_URL"] ?? "http://localhost:5173";
        var movieUrl    = $"{frontendUrl}/movies/{movie.Slug}";
        var posterSrc   = movie.PosterUrl is not null
            ? $"https://image.tmdb.org/t/p/w300{movie.PosterUrl}"
            : string.Empty;

        var html = $"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
              <title>{movie.Title} is Now Showing — BookKaroo</title>
            </head>
            <body style="margin:0;padding:0;background:#F4F4F5;font-family:'Inter','Segoe UI',Helvetica,Arial,sans-serif">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F4F4F5">
                <tr><td align="center" style="padding:24px 16px">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
                    style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)">

                    <tr><td align="center" style="background:linear-gradient(135deg,#0A0E1A,#1A2138);padding:28px 24px">
                      <span style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#FFF">
                        Book<span style="color:#E11D74">Karoo</span>
                      </span>
                    </td></tr>

                    <tr><td style="padding:36px 32px">
                      <p style="color:#6366F1;font-size:13px;font-weight:600;letter-spacing:0.08em;margin:0 0 8px;text-transform:uppercase">
                        Now Showing
                      </p>
                      <h2 style="color:#18181B;margin:0 0 16px;font-size:24px;line-height:1.3">
                        🎬 {movie.Title} is now playing in theatres!
                      </h2>

                      {(posterSrc.Length > 0 ? $"""
                      <div style="text-align:center;margin-bottom:20px">
                        <img src="{posterSrc}" alt="{movie.Title}" width="140"
                          style="border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.15);display:inline-block"/>
                      </div>
                      """ : "")}

                      <p style="color:#52525B;line-height:1.7;margin:0 0 8px">
                        Hi <strong>{user.Name}</strong>, great news! You asked us to remind you about
                        <strong>{movie.Title}</strong> — it's now available to book.
                      </p>
                      {(movie.Description is not null ? $"""
                      <p style="color:#71717A;font-size:14px;line-height:1.6;margin:0 0 20px;font-style:italic">
                        {movie.Description}
                      </p>
                      """ : "")}

                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                        style="background:#F9F9FB;border-radius:10px;margin-bottom:24px">
                        <tr>
                          <td style="padding:14px 16px;font-size:13px;color:#71717A">Duration</td>
                          <td style="padding:14px 16px;font-size:13px;font-weight:600;color:#18181B">{movie.DurationMin} min</td>
                        </tr>
                        <tr>
                          <td style="padding:14px 16px;font-size:13px;color:#71717A;border-top:1px solid #F0F0F0">Languages</td>
                          <td style="padding:14px 16px;font-size:13px;font-weight:600;color:#18181B;border-top:1px solid #F0F0F0">{string.Join(", ", movie.Languages)}</td>
                        </tr>
                        <tr>
                          <td style="padding:14px 16px;font-size:13px;color:#71717A;border-top:1px solid #F0F0F0">Formats</td>
                          <td style="padding:14px 16px;font-size:13px;font-weight:600;color:#18181B;border-top:1px solid #F0F0F0">{string.Join(", ", movie.Formats)}</td>
                        </tr>
                        {(movie.ImdbRating.HasValue ? $"""
                        <tr>
                          <td style="padding:14px 16px;font-size:13px;color:#71717A;border-top:1px solid #F0F0F0">IMDb Rating</td>
                          <td style="padding:14px 16px;font-size:13px;font-weight:600;color:#18181B;border-top:1px solid #F0F0F0">⭐ {movie.ImdbRating:F1}</td>
                        </tr>
                        """ : "")}
                      </table>

                      <div style="text-align:center">
                        <a href="{movieUrl}"
                          style="display:inline-block;background:linear-gradient(135deg,#E11D74,#A855F7);color:#FFF;
                                 padding:16px 40px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px">
                          🎟 Book Tickets Now
                        </a>
                      </div>
                    </td></tr>

                    <tr><td align="center" style="background:#FAFAFA;padding:20px;color:#A1A1AA;font-size:12px;line-height:1.5">
                      You're receiving this because you clicked "Remind Me" on BookKaroo.<br/>
                      © 2026 BookKaroo Pvt Ltd. All rights reserved.
                    </td></tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;

        await SendAsync(
            to:      user.Email,
            subject: $"🎬 {movie.Title} is Now Showing — Book Your Tickets!",
            html:    html,
            ct:      ct);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async Task SendAsync(
        string to, string subject, string html,
        string? text = null,
        IEnumerable<EmailAttachment>? attachments = null,
        CancellationToken ct = default)
    {
        var apiKey      = _config["RESEND_API_KEY"];
        var from        = _config["RESEND_FROM"] ?? "BookKaroo <onboarding@resend.dev>";
        var devOverride = _config["RESEND_DEV_OVERRIDE_TO"];
        if (!string.IsNullOrWhiteSpace(devOverride))
        {
            _logger.LogWarning("RESEND_DEV_OVERRIDE_TO set — redirecting email from {Original} to {Override}", to, devOverride);
            to = devOverride;
        }

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("RESEND_API_KEY not configured — skipping email to {To}", to);
            return;
        }

        var attachList = attachments?.Select(a => new { filename = a.Filename, content = a.ContentBase64 }).ToArray();

        var payload = new
        {
            from,
            to          = new[] { to },
            subject,
            html,
            text,
            attachments = attachList
        };

        var client = _http.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var json    = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        try
        {
            var response = await client.PostAsync("https://api.resend.com/emails", content, ct);
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("Resend API error {Status}: {Body}", response.StatusCode, body);
            }
            else
            {
                _logger.LogInformation("Email sent to {To}: {Subject}", to, subject);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", to);
        }
    }

    private static string BuildBookingConfirmationHtml(
        Booking booking, Show? show, Movie? movie, User user, string openTicketUrl, string companyGstin,
        string? qrUrl, DateTime? eventDate = null, string? eventTitle = null,
        string? venueName = null, string? screenName = null)
    {
        bool hasCoupon       = booking.CouponId.HasValue && booking.Discount > 0;
        var convFeeGst       = Math.Round(booking.ConvenienceFee * 0.18m, 2);
        var convFeeTotal     = Math.Round(booking.ConvenienceFee + convFeeGst, 2);
        var offerFeeGst      = booking.OfferProcessingFee > 0 ? Math.Round(booking.OfferProcessingFee * 0.18m, 2) : 0m;
        var offerFeeTotal    = Math.Round(booking.OfferProcessingFee + offerFeeGst, 2);
        var confirmNum       = booking.Id.ToString("N")[..6].ToUpper();
        var bookingDt        = booking.CreatedAt.ToLocalTime().ToString("ddd, dd MMM yyyy | hh:mm tt");
        // Movie booking: use show date/time. Event booking: use EventDate (has both date and time).
        var eventLocal  = eventDate?.ToLocalTime();
        var showDateStr = show is not null
            ? show.ShowDate.ToString("ddd, dd MMM yyyy")
            : (eventLocal.HasValue ? eventLocal.Value.ToString("ddd, dd MMM yyyy") : booking.CreatedAt.ToLocalTime().ToString("ddd, dd MMM yyyy"));
        var showTimeStr = show is not null
            ? show.ShowTime.ToString(@"hh\:mm tt")
            : (eventLocal.HasValue ? eventLocal.Value.ToString("hh:mm tt") : (booking.TierName ?? "Event"));
        var bookingRef  = booking.BookingRef;
        var movieTitle  = movie?.Title ?? eventTitle ?? (booking.TierName is not null ? $"Event — {booking.TierName}" : "Event Ticket");
        var certificate = string.IsNullOrEmpty(movie?.Certificate) ? "" : $" ({movie.Certificate})";
        var ticketAmtStr     = booking.TicketAmount.ToString("F2");
        var convFeeStr       = booking.ConvenienceFee.ToString("F2");
        var convFeeTotalStr  = convFeeTotal.ToString("F2");
        var convFeeGstStr    = convFeeGst.ToString("F2");
        var amountPaidStr    = booking.AmountPaid.ToString("F2");
        var offerFeeTotalStr = offerFeeTotal.ToString("F2");
        var offerFeeStr      = booking.OfferProcessingFee.ToString("F2");
        var offerFeeGstStr   = offerFeeGst.ToString("F2");
        var discountStr      = booking.Discount.ToString("F2");
        var ticketQty        = booking.TicketQty.ToString();
        var venueRow  = venueName is not null
            ? $$"""<tr><td style="padding:8px 16px 0;font-size:12px;color:#71717A">Venue</td><td style="padding:8px 16px 0;font-size:13px;font-weight:600;color:#18181B">{{venueName}}</td></tr>"""
            : string.Empty;
        var screenRow = screenName is not null
            ? $$"""<tr><td style="padding:4px 16px 12px;font-size:12px;color:#71717A">Screen</td><td style="padding:4px 16px 12px;font-size:13px;font-weight:600;color:#18181B">{{screenName}}</td></tr>"""
            : string.Empty;

        var qrBlock = qrUrl is not null ? $$"""
            <tr><td align="center" class="px" style="padding:0 32px 24px">
              <div style="font-size:13px;font-weight:700;color:#71717A;letter-spacing:1px;margin-bottom:12px">M-TICKET QR CODE</div>
              <p style="font-size:12px;color:#52525B;margin:0 0 12px">Scan this QR code at the cinema entry counter</p>
              <img src="{{qrUrl}}" alt="M-Ticket QR Code" width="200" height="200" style="display:block;margin:0 auto;border-radius:8px;border:1px solid #E4E4E7"/>
              <p style="font-size:11px;color:#A1A1AA;margin:8px 0 0">Booking ID: {{bookingRef}}</p>
            </td></tr>
            """ : "";

        var couponBlock = hasCoupon ? $$"""
            <tr><td colspan="2" style="border-top:1px dashed #E4E4E7;height:1px;line-height:1px;font-size:1px">&nbsp;</td></tr>
            <tr><td style="padding:16px 16px 4px;font-size:14px;font-weight:600;color:#18181B">Offer Processing Fee</td><td align="right" style="padding:16px 16px 4px;font-size:14px;font-weight:600;color:#18181B">Rs.{{offerFeeTotalStr}}</td></tr>
            <tr><td style="padding:0 16px 4px;font-size:13px;color:#71717A">Base Amount</td><td align="right" style="padding:0 16px 4px;font-size:13px;color:#71717A">Rs.{{offerFeeStr}}</td></tr>
            <tr><td style="padding:0 16px 16px;font-size:13px;color:#71717A">GST 18%</td><td align="right" style="padding:0 16px 16px;font-size:13px;color:#71717A">Rs.{{offerFeeGstStr}}</td></tr>
            <tr><td colspan="2" style="border-top:1px dashed #E4E4E7;height:1px;line-height:1px;font-size:1px">&nbsp;</td></tr>
            <tr><td style="padding:16px;font-size:14px;font-weight:600;color:#10B981">DISCOUNT</td><td align="right" style="padding:16px;font-size:14px;font-weight:600;color:#10B981">- Rs.{{discountStr}}</td></tr>
            """ : "";

        return $$"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
              <title>BookKaroo — Your Tickets</title>
              <style>
                @media (max-width:620px) {
                  .container { width:100% !important; }
                  .px { padding-left:16px !important;padding-right:16px !important; }
                  .stack { display:block !important;width:100% !important; }
                }
                body,table,td { font-family:'Inter','Segoe UI',Helvetica,Arial,sans-serif; }
                img { border:0;outline:none;text-decoration:none; }
                a { color:#E11D74;text-decoration:none; }
              </style>
            </head>
            <body style="margin:0;padding:0;background:#F4F4F5">
              <div style="display:none;max-height:0;overflow:hidden">
                Your booking {{bookingRef}} is confirmed. Seats on {{showDateStr}}.
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F4F4F5">
                <tr><td align="center" style="padding:24px 16px">
                  <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)">

                    <tr><td align="center" style="background:linear-gradient(135deg,#0A0E1A,#1A2138);padding:28px 24px">
                      <span style="font-family:'Playfair Display',Georgia,serif;font-size:32px;font-weight:700;color:#FFF;letter-spacing:-0.5px">
                        Book<span style="color:#E11D74">Karoo</span>
                      </span>
                    </td></tr>

                    <tr><td align="center" class="px" style="padding:28px 32px 8px">
                      <span style="display:inline-block;width:48px;height:48px;line-height:48px;border-radius:50%;background:rgba(16,185,129,0.15);color:#10B981;font-size:24px">✓</span>
                      <div style="font-size:24px;font-weight:700;color:#10B981;padding:8px 0 4px">Your booking is confirmed!</div>
                      <div style="font-size:14px;color:#71717A">Booking ID <strong style="color:#18181B;font-family:monospace">{{bookingRef}}</strong></div>
                    </td></tr>

                    <tr><td class="px" style="padding:24px 32px">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E4E4E7;border-radius:12px">
                        <tr>
                          <td class="stack" valign="top" style="padding:16px 16px 8px" colspan="2">
                            <div style="font-family:'Playfair Display',Georgia,serif;font-size:18px;font-weight:700;color:#18181B;margin-bottom:6px">{{movieTitle}}{{certificate}}</div>
                            <div style="font-size:13px;color:#52525B;line-height:1.5">{{showDateStr}} · {{showTimeStr}}</div>
                          </td>
                        </tr>
                        {{venueRow}}
                        {{screenRow}}
                      </table>
                    </td></tr>

                    <tr><td align="center" class="px" style="padding:8px 32px 24px">
                      <a href="{{openTicketUrl}}" style="display:inline-block;background:linear-gradient(135deg,#E11D74,#A855F7);color:#FFF;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;text-decoration:none">
                        Open Ticket
                      </a>
                    </td></tr>

                    <tr><td class="px" style="padding:0 32px"><hr style="border:0;border-top:1px solid #E4E4E7"/></td></tr>

                    <tr><td class="px" style="padding:24px 32px">
                      <div style="font-size:13px;font-weight:700;color:#71717A;letter-spacing:1px;margin-bottom:16px">ORDER SUMMARY</div>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E4E4E7;border-radius:12px">
                        <tr><td style="padding:16px 16px 4px;font-size:14px;font-weight:600;color:#18181B">TICKET AMOUNT</td><td align="right" style="padding:16px 16px 4px;font-size:14px;font-weight:600;color:#18181B">Rs.{{ticketAmtStr}}</td></tr>
                        <tr><td style="padding:0 16px 16px;font-size:13px;color:#71717A">Quantity</td><td align="right" style="padding:0 16px 16px;font-size:13px;color:#71717A">{{ticketQty}} tickets</td></tr>
                        <tr><td colspan="2" style="border-top:1px dashed #E4E4E7;height:1px;line-height:1px;font-size:1px">&nbsp;</td></tr>
                        <tr><td style="padding:16px 16px 4px;font-size:14px;font-weight:600;color:#18181B">CONVENIENCE FEES</td><td align="right" style="padding:16px 16px 4px;font-size:14px;font-weight:600;color:#18181B">Rs.{{convFeeTotalStr}}</td></tr>
                        <tr><td style="padding:0 16px 4px;font-size:13px;color:#71717A">Base Amount</td><td align="right" style="padding:0 16px 4px;font-size:13px;color:#71717A">Rs.{{convFeeStr}}</td></tr>
                        <tr><td style="padding:0 16px 16px;font-size:13px;color:#71717A">GST 18%</td><td align="right" style="padding:0 16px 16px;font-size:13px;color:#71717A">Rs.{{convFeeGstStr}}</td></tr>
                        {{couponBlock}}
                        <tr><td colspan="2" style="border-top:2px solid #E4E4E7;height:2px;line-height:2px;font-size:1px">&nbsp;</td></tr>
                        <tr><td style="padding:20px 16px;font-size:16px;font-weight:700;color:#18181B">AMOUNT PAID</td><td align="right" style="padding:20px 16px;font-size:18px;font-weight:700;color:#E11D74">Rs.{{amountPaidStr}}</td></tr>
                      </table>
                    </td></tr>

                    <tr><td class="px" style="padding:0 32px 24px">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAFAFA;border-radius:8px">
                        <tr>
                          <td style="padding:16px;width:33%;vertical-align:top">
                            <div style="font-size:11px;font-weight:600;color:#71717A;letter-spacing:0.5px;margin-bottom:4px">BOOKING DATE</div>
                            <div style="font-size:13px;font-weight:600;color:#18181B">{{bookingDt}}</div>
                          </td>
                          <td style="padding:16px;width:33%;vertical-align:top">
                            <div style="font-size:11px;font-weight:600;color:#71717A;letter-spacing:0.5px;margin-bottom:4px">PAYMENT</div>
                            <div style="font-size:13px;font-weight:600;color:#18181B">Mock Payment (Test Mode)</div>
                          </td>
                          <td style="padding:16px;width:33%;vertical-align:top">
                            <div style="font-size:11px;font-weight:600;color:#71717A;letter-spacing:0.5px;margin-bottom:4px">CONFIRMATION #</div>
                            <div style="font-size:13px;font-weight:600;color:#18181B">{{confirmNum}}</div>
                          </td>
                        </tr>
                      </table>
                    </td></tr>

                    {{qrBlock}}

                    <tr><td class="px" style="padding:0 32px 24px">
                      <div style="font-size:13px;font-weight:700;color:#71717A;letter-spacing:1px;margin-bottom:12px">IMPORTANT INSTRUCTIONS</div>
                      <ul style="margin:0;padding-left:20px;color:#52525B;font-size:13px;line-height:1.7">
                        <li>Please carry a valid government-issued photo ID. It will be checked at the venue.</li>
                        <li>Cancellation allowed if show is more than 2 hours away. Convenience fee is non-refundable.</li>
                        <li>Outside food and beverages are not allowed inside the venue.</li>
                        <li>Show the QR code above (or in the attached invoice) at the entry counter.</li>
                      </ul>
                    </td></tr>

                    <tr><td align="center" style="background:#FAFAFA;padding:24px 32px">
                      <div style="font-size:12px;color:#71717A;line-height:1.6">
                        Need help? Visit our <a href="https://bookkaroo.com/help" style="color:#E11D74">Help Centre</a><br/>
                        GST collected is paid to the department.<br/>
                        999799 — Other Services n.e.c. PAN Based GSTN: {{companyGstin}}
                      </div>
                      <div style="margin-top:16px">
                        <span style="font-family:'Playfair Display',Georgia,serif;font-size:18px;font-weight:700;color:#0A0E1A">
                          Book<span style="color:#E11D74">Karoo</span>
                        </span>
                      </div>
                      <div style="font-size:11px;color:#A1A1AA;margin-top:8px">© 2026 BookKaroo Pvt Ltd. All rights reserved.</div>
                    </td></tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;
    }

    private static string BuildBookingConfirmationText(Booking booking, Show? show, string movieTitle, User user, string openTicketUrl, DateTime? eventDate = null, string? venueName = null, string? screenName = null)
    {
        var eventLocal = eventDate?.ToLocalTime();
        var showLine = show is not null
            ? $"{show.ShowDate:ddd, dd MMM yyyy} · {show.ShowTime:hh\\:mm tt}"
            : (eventLocal.HasValue
                ? $"{eventLocal.Value:ddd, dd MMM yyyy} · {eventLocal.Value:hh:mm tt}"
                : (booking.TierName is not null ? $"Tier: {booking.TierName} × {booking.TicketQty} ticket(s)" : "Event Ticket"));
        var venueLine  = venueName  is not null ? $"\nVenue: {venueName}"   : string.Empty;
        var screenLine = screenName is not null ? $"\nScreen: {screenName}" : string.Empty;
        return $"""
            BookKaroo — Your Booking Is Confirmed!

            Booking ID: {booking.BookingRef}

            {movieTitle}
            {showLine}{venueLine}{screenLine}

            ORDER SUMMARY
            Ticket Amount ({booking.TicketQty} tickets): Rs.{booking.TicketAmount:F2}
            Convenience Fees: Rs.{booking.ConvenienceFee:F2} + GST
            {(booking.Discount > 0 ? $"Discount: -Rs.{booking.Discount:F2}" : "")}
            AMOUNT PAID: Rs.{booking.AmountPaid:F2}

            Booking Date: {booking.CreatedAt:ddd, dd MMM yyyy | hh:mm tt}
            Payment: Mock Payment (Test Mode)

            View ticket: {openTicketUrl}

            GST Invoice attached.
            """;
    }

    public async Task SendAccountDeletedAsync(User user, CancellationToken ct = default)
    {
        var frontendUrl = _config["FRONTEND_URL"] ?? "http://localhost:5173";
        var html = $"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
              <title>Account Deactivated — BookKaroo</title>
            </head>
            <body style="margin:0;padding:0;background:#F4F4F5;font-family:'Inter','Segoe UI',Helvetica,Arial,sans-serif">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F4F4F5">
                <tr><td align="center" style="padding:24px 16px">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06)">

                    <tr><td align="center" style="background:linear-gradient(135deg,#0A0E1A,#1A2138);padding:28px 24px">
                      <span style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#FFF">
                        Book<span style="color:#E11D74">Karoo</span>
                      </span>
                    </td></tr>

                    <tr><td style="padding:36px 32px">
                      <h2 style="color:#18181B;margin:0 0 12px;font-size:22px">
                        Your account has been deactivated
                      </h2>
                      <p style="color:#52525B;line-height:1.7;margin:0 0 16px">
                        Hi <strong>{user.Name}</strong>, your BookKaroo account associated with
                        <strong>{user.Email}</strong> has been deactivated as requested.
                      </p>
                      <p style="color:#52525B;line-height:1.7;margin:0 0 16px">
                        Your booking history has been retained for legal and compliance purposes.
                        Your personal data will be permanently removed within 30 days.
                      </p>
                      <p style="color:#52525B;line-height:1.7;margin:0 0 24px">
                        If you believe this was a mistake or want to reactivate your account,
                        please contact our support team within 7 days.
                      </p>
                      <a href="{frontendUrl}/help"
                         style="display:inline-block;background:#E11D74;color:#FFF;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
                        Contact Support
                      </a>
                    </td></tr>

                    <tr><td align="center" style="background:#FAFAFA;padding:20px 32px;color:#71717A;font-size:12px;line-height:1.6">
                      We're sorry to see you go. Thank you for being part of BookKaroo.<br/>
                      © 2026 BookKaroo Pvt Ltd. All rights reserved.
                    </td></tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;

        var text = $"""
            BookKaroo — Account Deactivated

            Hi {user.Name},

            Your BookKaroo account ({user.Email}) has been deactivated as requested.

            Your booking history has been retained for legal and compliance purposes.
            Your personal data will be permanently removed within 30 days.

            If this was a mistake, contact us at {frontendUrl}/help within 7 days.

            Thank you for being part of BookKaroo.
            """;

        await SendAsync(user.Email, "Your BookKaroo account has been deactivated", html, text, ct: ct);
    }

    // ── LYS emails ───────────────────────────────────────────────────────────

    public async Task SendLysOrganizerWelcomeAsync(string toEmail, string name, CancellationToken ct = default)
    {
        var html = $"""
            <!DOCTYPE html><html lang="en"><body style="font-family:sans-serif;color:#333;max-width:600px;margin:auto;padding:24px">
            <h2 style="color:#4F46E5">Welcome to BookKaroo ListYourShow!</h2>
            <p>Hi {name},</p>
            <p>Your organizer account has been created. You can now submit events for review.</p>
            <p>Once your event is approved, it will go live on BookKaroo and customers can start booking tickets.</p>
            <hr/><p style="color:#999;font-size:12px">BookKaroo — Book the moment. Karo it now.</p>
            </body></html>
            """;
        await SendAsync(toEmail, "Welcome to BookKaroo ListYourShow!", html, ct: ct);
    }

    public async Task SendLysSubmissionToAdminAsync(
        string adminEmail, string organizerName, string eventTitle,
        string eventType, DateTime eventDate, CancellationToken ct = default)
    {
        var frontendUrl = _config["FRONTEND_URL"] ?? "http://localhost:5173";
        var html = $"""
            <!DOCTYPE html><html lang="en"><body style="font-family:sans-serif;color:#333;max-width:600px;margin:auto;padding:24px">
            <h2 style="color:#E11D74">[LYS] New Event Submission</h2>
            <p><strong>Event:</strong> {eventTitle}</p>
            <p><strong>Organizer:</strong> {organizerName}</p>
            <p><strong>Type:</strong> {eventType}</p>
            <p><strong>Date:</strong> {eventDate:dd MMM yyyy, h:mm tt}</p>
            <a href="{frontendUrl}/admin/lys/submissions" style="background:#4F46E5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Review Submission</a>
            </body></html>
            """;
        await SendAsync(adminEmail, $"[LYS] New Submission: {eventTitle}", html, ct: ct);
    }

    public async Task SendLysApprovedAsync(
        string toEmail, string organizerName, string eventTitle,
        string eventSlug, string frontendUrl, CancellationToken ct = default)
    {
        var eventUrl = $"{frontendUrl}/events/{eventSlug}";
        var html = $"""
            <!DOCTYPE html><html lang="en"><body style="font-family:sans-serif;color:#333;max-width:600px;margin:auto;padding:24px">
            <h2 style="color:#27AE60">🎉 Your event is now live!</h2>
            <p>Hi {organizerName},</p>
            <p>Congratulations! Your event <strong>{eventTitle}</strong> has been approved and is now live on BookKaroo.</p>
            <p>Customers can start booking tickets right away.</p>
            <a href="{eventUrl}" style="background:#27AE60;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">View Your Event</a>
            <hr/><p style="color:#999;font-size:12px">BookKaroo — Book the moment. Karo it now.</p>
            </body></html>
            """;
        await SendAsync(toEmail, $"🎉 Your event '{eventTitle}' is now live on BookKaroo!", html, ct: ct);
    }

    public async Task SendLysRejectedAsync(
        string toEmail, string organizerName, string eventTitle,
        string reason, CancellationToken ct = default)
    {
        var html = $"""
            <!DOCTYPE html><html lang="en"><body style="font-family:sans-serif;color:#333;max-width:600px;margin:auto;padding:24px">
            <h2 style="color:#E74C3C">Update on your event submission</h2>
            <p>Hi {organizerName},</p>
            <p>Thank you for submitting <strong>{eventTitle}</strong> to BookKaroo.</p>
            <p>After review, we are unable to approve this submission.</p>
            <p><strong>Reason:</strong> {reason}</p>
            <p>You are welcome to make changes and resubmit. If you have questions, contact <a href="mailto:support@bookkaroo.com">support@bookkaroo.com</a>.</p>
            <hr/><p style="color:#999;font-size:12px">BookKaroo — Book the moment. Karo it now.</p>
            </body></html>
            """;
        await SendAsync(toEmail, $"Update on your event '{eventTitle}' submission", html, ct: ct);
    }

    public async Task SendLysChangesRequestedAsync(
        string toEmail, string organizerName, string eventTitle,
        Guid eventId, string notes, string frontendUrl, CancellationToken ct = default)
    {
        var editUrl = $"{frontendUrl}/list-your-show/events/{eventId}/edit";
        var html = $"""
            <!DOCTYPE html><html lang="en"><body style="font-family:sans-serif;color:#333;max-width:600px;margin:auto;padding:24px">
            <h2 style="color:#F39C12">Changes needed for your event</h2>
            <p>Hi {organizerName},</p>
            <p>We reviewed <strong>{eventTitle}</strong> and need some changes before approval.</p>
            <p><strong>Required changes:</strong></p>
            <blockquote style="border-left:4px solid #F39C12;padding-left:16px;color:#555">{notes}</blockquote>
            <p>Please log in, make the requested changes, and resubmit.</p>
            <a href="{editUrl}" style="background:#F39C12;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Edit &amp; Resubmit</a>
            <hr/><p style="color:#999;font-size:12px">BookKaroo — Book the moment. Karo it now.</p>
            </body></html>
            """;
        await SendAsync(toEmail, $"Changes needed for your event '{eventTitle}'", html, ct: ct);
    }

    public async Task SendLysPartnerApprovalRequestAsync(
        string toEmail, string partnerName, string eventTitle,
        Guid eventId, string organizerName, string frontendUrl, CancellationToken ct = default)
    {
        var reviewUrl = $"{frontendUrl}/partner/lys";
        var html = $"""
            <!DOCTYPE html><html lang="en"><body style="font-family:sans-serif;color:#333;max-width:600px;margin:auto;padding:24px">
            <h2 style="color:#6366F1">New event submission at your venue</h2>
            <p>Hi {partnerName},</p>
            <p>Organizer <strong>{organizerName}</strong> has submitted an event <strong>{eventTitle}</strong> at your venue for approval.</p>
            <p>Please review and approve or reject this event before it goes to the BookKaroo admin team.</p>
            <a href="{reviewUrl}" style="background:#6366F1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Review Submissions</a>
            <hr/><p style="color:#999;font-size:12px">BookKaroo — Book the moment. Karo it now.</p>
            </body></html>
            """;
        await SendAsync(toEmail, $"New event submission: '{eventTitle}' — action required", html, ct: ct);
    }

    public async Task SendLysPartnerApprovedAsync(
        string toEmail, string organizerName, string eventTitle, CancellationToken ct = default)
    {
        var html = $"""
            <!DOCTYPE html><html lang="en"><body style="font-family:sans-serif;color:#333;max-width:600px;margin:auto;padding:24px">
            <h2 style="color:#27AE60">Venue partner approved your event</h2>
            <p>Hi {organizerName},</p>
            <p>The venue partner has approved <strong>{eventTitle}</strong>. Your event is now in review with the BookKaroo admin team.</p>
            <p>You will receive another notification once admin completes the review.</p>
            <hr/><p style="color:#999;font-size:12px">BookKaroo — Book the moment. Karo it now.</p>
            </body></html>
            """;
        await SendAsync(toEmail, $"Your event '{eventTitle}' was approved by venue partner", html, ct: ct);
    }

    public async Task SendLysPartnerRejectedAsync(
        string toEmail, string organizerName, string eventTitle, string reason, CancellationToken ct = default)
    {
        var html = $"""
            <!DOCTYPE html><html lang="en"><body style="font-family:sans-serif;color:#333;max-width:600px;margin:auto;padding:24px">
            <h2 style="color:#E74C3C">Your event was declined by the venue</h2>
            <p>Hi {organizerName},</p>
            <p>The venue partner has declined <strong>{eventTitle}</strong>.</p>
            <p><strong>Reason:</strong></p>
            <blockquote style="border-left:4px solid #E74C3C;padding-left:16px;color:#555">{reason}</blockquote>
            <p>You may choose a different venue or contact the venue directly for more information.</p>
            <hr/><p style="color:#999;font-size:12px">BookKaroo — Book the moment. Karo it now.</p>
            </body></html>
            """;
        await SendAsync(toEmail, $"Your event '{eventTitle}' was declined by the venue", html, ct: ct);
    }

    private record EmailAttachment(string Filename, string ContentBase64);
}
