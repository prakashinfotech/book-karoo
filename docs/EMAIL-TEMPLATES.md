# BookKaroo — Email Templates

> All emails sent via **Resend**. Templates are HTML strings rendered server-side via Razor or string interpolation.
> Email must render correctly in Gmail (web + iOS + Android), Outlook, Apple Mail.
> Use **table-based layout** (email client compat) and **inline CSS only** (no `<style>` blocks for max compatibility — but a `<style>` block in `<head>` is supported by Gmail and used for media queries).

## Resend Configuration

```ts
// Backend service
new Resend(apiKey).Emails.SendAsync(new {
  from = "BookKaroo <onboarding@resend.dev>",   // dev: use resend.dev; prod: tickets@bookkaroo.com after domain verify
  to = booking.customer_email,
  subject = $"Your Tickets — {booking.movie_title} — {booking.booking_ref}",
  html = renderedHtml,
  text = plainTextFallback,
  attachments = new[] {
    new Attachment {
      filename = $"{booking.booking_ref}_GST_Invoice.pdf",
      content = invoicePdfBase64
    }
  }
});
```

---

## 1. Booking Confirmation Email — "Your Tickets"

### Merge Variables
```
{{customer_name}}            → "Aarav Sharma"
{{customer_email}}           → "aarav@example.com"
{{booking_ref}}              → "BK-20260320-WS22Q"
{{movie_title}}              → "Dhurandhar The Revenge"
{{certificate}}              → "A"
{{poster_url}}               → CDN URL (TMDB)
{{show_time_label}}          → "01:30 PM"
{{show_date_label}}          → "Sun, 22 Mar, 2026"
{{venue_name}}               → "Rajhans Cinemas: The CBD Mall, Zundal Circle"
{{screen_name}}              → "SCREEN 1"
{{venue_city}}               → "Ahmedabad"
{{seat_category}}            → "EXECUTIVE"
{{seat_labels}}              → "H12, H13"
{{ticket_qty}}               → 2
{{ticket_amount}}            → "900.00"
{{convenience_fee}}          → "118.00"
{{convenience_fee_gst}}      → "21.24"
{{convenience_fee_total}}    → "139.24"
{{offer_processing_fee}}     → "15.00"   (or null)
{{offer_processing_fee_gst}} → "2.70"    (or null)
{{offer_processing_total}}   → "17.70"   (or null)
{{discount}}                 → "450.00"  (or "0.00")
{{amount_paid}}              → "606.94"
{{booking_datetime_label}}   → "Fri, 20 Mar, 2026 | 05:38 PM"
{{payment_method_label}}     → "Mock Payment (Test Mode)" / "Credit Card" / "UPI" etc.
{{confirmation_number}}      → "417277"  (last 6 digits of booking id, formatted)
{{open_ticket_url}}          → "https://bookkaroo.com/bookings/BK-20260320-WS22Q"
{{has_coupon}}               → bool, controls discount + offer fee blocks
{{cancellation_allowed}}     → bool, controls instruction text
```

### Plain-Text Fallback
```
BookKaroo — Your Booking Is Confirmed!

Booking ID: {{booking_ref}}

{{movie_title}} ({{certificate}})
{{show_time_label}} | {{show_date_label}}
{{venue_name}}, {{venue_city}}
{{screen_name}} — {{seat_category}}: {{seat_labels}}

ORDER SUMMARY
Ticket Amount ({{ticket_qty}} tickets): Rs.{{ticket_amount}}
Convenience Fees: Rs.{{convenience_fee_total}}
  Base: Rs.{{convenience_fee}}
  GST 18%: Rs.{{convenience_fee_gst}}
{{#if has_coupon}}
Offer Processing Fee: Rs.{{offer_processing_total}}
  Base: Rs.{{offer_processing_fee}}
  GST 18%: Rs.{{offer_processing_fee_gst}}
Discount: -Rs.{{discount}}
{{/if}}
AMOUNT PAID: Rs.{{amount_paid}}

Booking Date: {{booking_datetime_label}}
Payment: {{payment_method_label}}
Confirmation #: {{confirmation_number}}

View ticket: {{open_ticket_url}}

GST Invoice attached.
```

### HTML Template (Email-Safe, Inline CSS)

> Save as `backend/src/BookKaroo.Infrastructure/Email/Templates/booking-confirmation.html`
> Variables use `{{var}}` (Scriban or simple replace).
> Width: 600px max, fluid below 600px.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BookKaroo — Your Tickets</title>
  <style>
    @media (max-width: 620px) {
      .container { width: 100% !important; }
      .px { padding-left: 16px !important; padding-right: 16px !important; }
      .stack { display: block !important; width: 100% !important; }
      .poster { width: 100px !important; }
      .summary-row td { font-size: 13px !important; }
    }
    /* Defensive resets */
    body, table, td { font-family: 'Inter', 'Segoe UI', Helvetica, Arial, sans-serif; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { color: #E11D74; text-decoration: none; }
  </style>
</head>
<body style="margin:0; padding:0; background:#F4F4F5;">
  <!-- Preheader (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    Your booking {{booking_ref}} for {{movie_title}} is confirmed. {{seat_labels}} on {{show_date_label}}.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F4F4F5">
    <tr>
      <td align="center" style="padding: 24px 16px;">

        <!-- Container -->
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF; border-radius: 16px; overflow:hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">

          <!-- Header / Logo -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #0A0E1A 0%, #1A2138 100%); padding: 28px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
                      Book<span style="color:#E11D74;">Karoo</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Confirmation Banner -->
          <tr>
            <td align="center" class="px" style="padding: 28px 32px 8px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <span style="display:inline-block; width:48px; height:48px; line-height:48px; border-radius:50%; background:#10B98115; color:#10B981; font-size:24px;">✓</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size: 24px; font-weight: 700; color: #10B981; padding-bottom: 4px;">
                    Your booking is confirmed!
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size: 14px; color: #71717A;">
                    Booking ID <strong style="color:#18181B; font-family: 'JetBrains Mono', monospace;">{{booking_ref}}</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Movie / Show Card -->
          <tr>
            <td class="px" style="padding: 24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="stack" valign="top" width="140" style="padding-right: 16px;">
                    <img src="{{poster_url}}" alt="{{movie_title}} poster" class="poster" width="120" style="width:120px; height:auto; border-radius: 8px; display:block;" />
                  </td>
                  <td class="stack" valign="top">
                    <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #18181B; line-height: 1.2; margin-bottom: 8px;">
                      {{movie_title}} <span style="font-size:14px; color:#71717A; font-family: 'Inter', sans-serif;">({{certificate}})</span>
                    </div>
                    <div style="font-size: 14px; color: #18181B; margin-bottom: 6px;">
                      <strong>{{show_time_label}}</strong> | {{show_date_label}}
                    </div>
                    <div style="font-size: 13px; color: #52525B; line-height: 1.5; margin-bottom: 4px;">
                      {{venue_name}}<br/>
                      {{venue_city}}
                    </div>
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #E4E4E7;">
                      <span style="display:inline-block; padding: 4px 10px; background:#0A0E1A; color:#FFFFFF; font-size:12px; font-weight:600; border-radius: 4px; letter-spacing: 0.5px;">
                        {{seat_category}}
                      </span>
                      <span style="display:inline-block; margin-left:8px; font-size: 14px; font-weight:600; color:#18181B;">
                        {{seat_labels}}
                      </span>
                    </div>
                    <div style="font-size: 12px; color: #71717A; margin-top: 8px;">{{screen_name}}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Booking Confirmed stamp + CTA -->
          <tr>
            <td align="center" class="px" style="padding: 8px 32px 24px 32px;">
              <div style="font-size: 14px; color: #52525B; padding-bottom: 16px;">
                Check your booking details, discounts, deals<br/>and much more with your ticket
              </div>
              <a href="{{open_ticket_url}}" style="display:inline-block; background: linear-gradient(135deg, #E11D74 0%, #A855F7 100%); color: #FFFFFF; font-size: 15px; font-weight: 600; padding: 14px 36px; border-radius: 8px; text-decoration: none;">
                Open Ticket
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td class="px" style="padding: 0 32px;">
              <hr style="border:0; border-top: 1px solid #E4E4E7;" />
            </td>
          </tr>

          <!-- Order Summary -->
          <tr>
            <td class="px" style="padding: 24px 32px;">
              <div style="font-size: 13px; font-weight: 700; color: #71717A; letter-spacing: 1px; margin-bottom: 16px;">ORDER SUMMARY</div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #E4E4E7; border-radius: 12px;">

                <!-- Ticket Amount -->
                <tr class="summary-row">
                  <td style="padding: 16px 16px 4px 16px; font-size: 14px; font-weight:600; color:#18181B;">TICKET AMOUNT</td>
                  <td align="right" style="padding: 16px 16px 4px 16px; font-size: 14px; font-weight:600; color:#18181B;">Rs.{{ticket_amount}}</td>
                </tr>
                <tr class="summary-row">
                  <td style="padding: 0 16px 16px 16px; font-size: 13px; color: #71717A;">Quantity</td>
                  <td align="right" style="padding: 0 16px 16px 16px; font-size: 13px; color: #71717A;">{{ticket_qty}} tickets</td>
                </tr>

                <tr><td colspan="2" style="border-top: 1px dashed #E4E4E7; height:1px; line-height:1px; font-size:1px;">&nbsp;</td></tr>

                <!-- Convenience Fees -->
                <tr class="summary-row">
                  <td style="padding: 16px 16px 4px 16px; font-size: 14px; font-weight:600; color:#18181B;">CONVENIENCE FEES</td>
                  <td align="right" style="padding: 16px 16px 4px 16px; font-size: 14px; font-weight:600; color:#18181B;">Rs.{{convenience_fee_total}}</td>
                </tr>
                <tr class="summary-row">
                  <td style="padding: 0 16px 4px 16px; font-size: 13px; color: #71717A;">Base Amount</td>
                  <td align="right" style="padding: 0 16px 4px 16px; font-size: 13px; color: #71717A;">Rs.{{convenience_fee}}</td>
                </tr>
                <tr class="summary-row">
                  <td style="padding: 0 16px 16px 16px; font-size: 13px; color: #71717A;">Integrated GST (IGST) @ 18%</td>
                  <td align="right" style="padding: 0 16px 16px 16px; font-size: 13px; color: #71717A;">Rs.{{convenience_fee_gst}}</td>
                </tr>

                {{#if has_coupon}}
                <tr><td colspan="2" style="border-top: 1px dashed #E4E4E7; height:1px; line-height:1px; font-size:1px;">&nbsp;</td></tr>

                <tr class="summary-row">
                  <td style="padding: 16px 16px 4px 16px; font-size: 14px; font-weight:600; color:#18181B;">Offer Processing Fee</td>
                  <td align="right" style="padding: 16px 16px 4px 16px; font-size: 14px; font-weight:600; color:#18181B;">Rs.{{offer_processing_total}}</td>
                </tr>
                <tr class="summary-row">
                  <td style="padding: 0 16px 4px 16px; font-size: 13px; color: #71717A;">Base Amount</td>
                  <td align="right" style="padding: 0 16px 4px 16px; font-size: 13px; color: #71717A;">Rs.{{offer_processing_fee}}</td>
                </tr>
                <tr class="summary-row">
                  <td style="padding: 0 16px 16px 16px; font-size: 13px; color: #71717A;">Integrated GST (IGST) @ 18%</td>
                  <td align="right" style="padding: 0 16px 16px 16px; font-size: 13px; color: #71717A;">Rs.{{offer_processing_fee_gst}}</td>
                </tr>

                <tr><td colspan="2" style="border-top: 1px dashed #E4E4E7; height:1px; line-height:1px; font-size:1px;">&nbsp;</td></tr>

                <tr class="summary-row">
                  <td style="padding: 16px; font-size: 14px; font-weight:600; color:#10B981;">DISCOUNT</td>
                  <td align="right" style="padding: 16px; font-size: 14px; font-weight:600; color:#10B981;">- Rs.{{discount}}</td>
                </tr>
                {{/if}}

                <tr><td colspan="2" style="border-top: 2px solid #E4E4E7; height:2px; line-height:2px; font-size:1px;">&nbsp;</td></tr>

                <!-- Amount Paid -->
                <tr class="summary-row">
                  <td style="padding: 20px 16px; font-size: 16px; font-weight: 700; color: #18181B;">AMOUNT PAID</td>
                  <td align="right" style="padding: 20px 16px; font-size: 18px; font-weight: 700; color: #E11D74;">Rs.{{amount_paid}}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Meta strip -->
          <tr>
            <td class="px" style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FAFAFA; border-radius: 8px;">
                <tr>
                  <td class="stack" style="padding: 16px; width: 33%; vertical-align: top;">
                    <div style="font-size: 11px; font-weight: 600; color: #71717A; letter-spacing: 0.5px; margin-bottom: 4px;">BOOKING DATE</div>
                    <div style="font-size: 13px; font-weight: 600; color: #18181B;">{{booking_datetime_label}}</div>
                  </td>
                  <td class="stack" style="padding: 16px; width: 33%; vertical-align: top;">
                    <div style="font-size: 11px; font-weight: 600; color: #71717A; letter-spacing: 0.5px; margin-bottom: 4px;">PAYMENT</div>
                    <div style="font-size: 13px; font-weight: 600; color: #18181B;">{{payment_method_label}}</div>
                  </td>
                  <td class="stack" style="padding: 16px; width: 33%; vertical-align: top;">
                    <div style="font-size: 11px; font-weight: 600; color: #71717A; letter-spacing: 0.5px; margin-bottom: 4px;">CONFIRMATION #</div>
                    <div style="font-size: 13px; font-weight: 600; color: #18181B;">{{confirmation_number}}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Important Instructions -->
          <tr>
            <td class="px" style="padding: 0 32px 24px 32px;">
              <div style="font-size: 13px; font-weight: 700; color: #71717A; letter-spacing: 1px; margin-bottom: 12px;">IMPORTANT INSTRUCTIONS</div>
              <ul style="margin: 0; padding-left: 20px; color: #52525B; font-size: 13px; line-height: 1.7;">
                <li>Please carry a valid government-issued photo ID. It will be checked at the venue.</li>
                <li>{{cancellation_text}}</li>
                <li>Outside food and beverages are not allowed inside the venue.</li>
                <li>Show the QR code (in attached invoice) at the entry counter.</li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background:#FAFAFA; padding: 24px 32px;">
              <div style="font-size: 12px; color: #71717A; line-height: 1.6;">
                Need help? Visit our <a href="https://bookkaroo.com/help" style="color:#E11D74; text-decoration:none;">Help Centre</a><br/>
                GST collected is paid to the department.<br/>
                999799 — Other Services n.e.c. PAN Based GSTN: {{company_gstin}}
              </div>
              <div style="margin-top: 16px;">
                <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 18px; font-weight: 700; color: #0A0E1A;">
                  Book<span style="color:#E11D74;">Karoo</span>
                </span>
              </div>
              <div style="font-size: 11px; color: #A1A1AA; margin-top: 8px;">
                © 2026 BookKaroo Pvt Ltd. All rights reserved.
              </div>
            </td>
          </tr>

        </table>
        <!-- end container -->

      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Other Phase 1 Emails (stub specs — implement same patterns)

### Welcome Email
**Subject:** Welcome to BookKaroo, {{customer_name}}! 🎬
**Body:** thank-you, "explore movies in {{city}}" CTA, link to /movies

### Password Reset Email
**Subject:** Reset your BookKaroo password
**Body:** "We received a request..." + reset button (1-hour expiring token), "ignore if you didn't request this"

### Booking Cancelled / Refund Email
**Subject:** Your booking {{booking_ref}} has been cancelled
**Body:** confirmation, refund amount, refund timeline (7 business days), help link

---

## 2a. Additional Emails (implemented, not yet fully spec'd here)

`ResendEmailService.cs` implements several more email types beyond what's detailed above — full specs TBD, listed here so this doc isn't silently missing them:

- `SendContactSupportAsync` — forwards a contact-form submission to support
- `SendMovieNowShowingAsync` — notifies users who set a "Remind Me" alert once a coming-soon movie opens
- `SendAccountDeletedAsync` — confirms account soft-deletion
- **Partner portal:** partner approval request (to admin), partner approved, partner rejected
- **LYS (List Your Show):** organizer welcome, event submission received (to admin), event approved, event rejected, event changes-requested

---

## 3. Implementation Notes

### Templating
- **Recommended:** [Scriban](https://github.com/scriban/scriban) for .NET — fast, safe, supports `{{ }}` and `{{#if}}`
- Alternative: simple `string.Replace` for MVP (no conditionals)

### Email Service Layer
```csharp
// BookKaroo.Application/Interfaces/IEmailService.cs
public interface IEmailService {
    Task SendBookingConfirmationAsync(Booking b, byte[] invoicePdf, CancellationToken ct);
    Task SendWelcomeAsync(User u, CancellationToken ct);
    Task SendPasswordResetAsync(User u, string token, CancellationToken ct);
    Task SendBookingCancelledAsync(Booking b, decimal refundAmount, CancellationToken ct);
}

// BookKaroo.Infrastructure/Email/ResendEmailService.cs
public class ResendEmailService : IEmailService {
    // uses Resend SDK or plain HttpClient
}
```

### Testing
- Render template with sample data → save HTML to `/tests/email-snapshots/`
- Compare on every change to catch regressions
- Use [Litmus](https://www.litmus.com/) or [Email on Acid](https://www.emailonacid.com/) free trials before launch
- Send to `litmus.com/preview/email` for client compat checks

### Free-tier Caveats (Resend)
- **From `onboarding@resend.dev`** until domain verified
- Only sends to your verified email until domain set up
- 100 emails/day free, 3000/month
- Domain verification requires DNS access (TXT + MX records)
