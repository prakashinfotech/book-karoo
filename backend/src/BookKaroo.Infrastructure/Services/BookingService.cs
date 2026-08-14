using System.Text.Json;
using BookKaroo.Application.DTOs.Booking;
using BookKaroo.Application.DTOs.Events;
using BookKaroo.Application.DTOs.Payment;
using BookKaroo.Application.DTOs.Pricing;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Application.Services;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;
using PaymentEntity = BookKaroo.Domain.Entities.Payment;
using BookKaroo.Infrastructure.Data;
using BookKaroo.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using QRCoder;

namespace BookKaroo.Infrastructure.Services;

public class BookingService : IBookingService
{
    private readonly BookKarooDbContext          _db;
    private readonly IShowRepository             _shows;
    private readonly IRepository<Venue>          _venues;
    private readonly IRepository<Screen>         _screens;
    private readonly IMovieRepository            _movies;
    private readonly ISeatLockRepository         _locks;
    private readonly IEventTicketLockRepository  _eventLocks;
    private readonly IUserRepository             _users;
    private readonly IPricingService             _pricing;
    private readonly ICouponRepository           _coupons;
    private readonly ICouponService              _couponSvc;
    private readonly ISettingRepository          _settings;
    private readonly SupabaseStorageService      _storage;
    private readonly IServiceScopeFactory        _scopeFactory;
    private readonly ILogger<BookingService>     _logger;

    private static readonly JsonSerializerOptions JsonOpts =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public BookingService(
        BookKarooDbContext          db,
        IShowRepository             shows,
        IRepository<Venue>          venues,
        IRepository<Screen>         screens,
        IMovieRepository            movies,
        ISeatLockRepository         locks,
        IEventTicketLockRepository  eventLocks,
        IUserRepository             users,
        IPricingService             pricing,
        ICouponRepository           coupons,
        ICouponService              couponSvc,
        ISettingRepository          settings,
        SupabaseStorageService      storage,
        IServiceScopeFactory        scopeFactory,
        ILogger<BookingService>     logger)
    {
        _db           = db;
        _shows        = shows;
        _venues       = venues;
        _screens      = screens;
        _movies       = movies;
        _locks        = locks;
        _eventLocks   = eventLocks;
        _users        = users;
        _pricing      = pricing;
        _coupons      = coupons;
        _couponSvc    = couponSvc;
        _settings     = settings;
        _storage      = storage;
        _scopeFactory = scopeFactory;
        _logger       = logger;
    }

    public async Task<BookingDetailResponse> FinalizeBookingAsync(
        Guid bookingId, string providerPaymentId, CancellationToken ct = default)
    {
        var booking = await _db.Bookings
            .FirstOrDefaultAsync(b => b.Id == bookingId, ct)
            ?? throw new NotFoundException("Booking not found.");

        if (booking.Status != BookingStatus.Pending)
            throw new ConflictException("Booking already processed.");

        List<string> finalSeatLabels = [];
        PaymentEntity? finalPayment  = null;

        var strategy = _db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await _db.Database.BeginTransactionAsync(ct);
            try
            {
                // a. Update payment
                var payment = await _db.Payments.FirstOrDefaultAsync(p => p.BookingId == bookingId, ct);
                if (payment is not null)
                {
                    payment.ProviderPaymentId = providerPaymentId;
                    payment.Status            = PaymentStatus.Captured;
                    payment.CapturedAt        = DateTime.UtcNow;
                    payment.Method            = "mock";
                }
                finalPayment = payment;

                // b. Confirm booking
                booking.Status = BookingStatus.Confirmed;

                // c. Delete seat locks for this show + seats
                var seatLabels = await _db.BookingSeats
                    .Where(bs => bs.BookingId == bookingId)
                    .Select(bs => bs.SeatLabel)
                    .ToListAsync(ct);
                finalSeatLabels = seatLabels;

                var locks = booking.ShowId.HasValue
                    ? await _db.SeatLocks
                        .Where(sl => sl.ShowId == booking.ShowId.Value && seatLabels.Contains(sl.SeatLabel))
                        .ToListAsync(ct)
                    : [];
                _db.SeatLocks.RemoveRange(locks);

                // d. Invoice number
                booking.InvoiceNumber = $"TIN{DateTime.UtcNow:yy}{booking.Id:N}"[..14].ToUpper();

                // e. QR code (best-effort — failure does not abort the transaction)
                try
                {
                    var qrBytes = GenerateQr(booking.BookingRef);
                    var qrUrl   = await _storage.UploadQrAsync(booking.BookingRef, qrBytes, ct);
                    if (qrUrl is not null) booking.QrUrl = qrUrl;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "QR upload failed for {Ref} — continuing", booking.BookingRef);
                }

                await _db.SaveChangesAsync(ct);
                await tx.CommitAsync(ct);
                _logger.LogInformation("Booking finalized: {Ref}", booking.BookingRef);
            }
            catch
            {
                await tx.RollbackAsync(ct);
                throw;
            }
        });

        // Fire-and-forget notification in its own DI scope so scoped services survive
        var capturedId  = booking.Id;
        var capturedRef = booking.BookingRef;
        _ = Task.Run(async () =>
        {
            await using var scope = _scopeFactory.CreateAsyncScope();
            var notifications = scope.ServiceProvider.GetRequiredService<INotificationService>();
            try
            {
                await notifications.SendBookingConfirmedAsync(capturedId);
                _logger.LogInformation("Notification sent for {Ref}", capturedRef);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Notification failed for {Ref}", capturedRef);
            }
        }, CancellationToken.None);

        return await BuildDetailAsync(booking, finalPayment, finalSeatLabels, ct);
    }

    public async Task<BookingDetailResponse> GetByRefAsync(
        string bookingRef, Guid userId, CancellationToken ct = default)
    {
        var booking = await _db.Bookings
            .FirstOrDefaultAsync(b => b.BookingRef == bookingRef && b.UserId == userId, ct)
            ?? throw new NotFoundException("Booking not found.");

        var payment = await _db.Payments.FirstOrDefaultAsync(p => p.BookingId == booking.Id, ct);
        var seats   = await _db.BookingSeats
            .Where(bs => bs.BookingId == booking.Id)
            .Select(bs => bs.SeatLabel)
            .ToListAsync(ct);

        return await BuildDetailAsync(booking, payment, seats, ct);
    }

    public async Task<PaginatedBookings> GetByUserAsync(
        Guid userId, string? tab, int page, int pageSize, CancellationToken ct = default)
    {
        var now   = DateTime.UtcNow;
        var query = _db.Bookings.Where(b => b.UserId == userId && b.DeletedAt == null);

        query = tab switch
        {
            "upcoming" => query
                .Where(b => b.Status == BookingStatus.Confirmed && (
                    (b.ShowId.HasValue && _db.Shows.Any(s => s.Id == b.ShowId && s.ShowDatetime > now)) ||
                    (b.EventId.HasValue && _db.Events.Any(e => e.Id == b.EventId && e.EventDate > now))))
                .OrderBy(b =>
                    b.ShowId.HasValue
                        ? _db.Shows.Where(s => s.Id == b.ShowId).Select(s => s.ShowDatetime).FirstOrDefault()
                        : _db.Events.Where(e => e.Id == b.EventId).Select(e => e.EventDate ?? DateTime.MinValue).FirstOrDefault()),
            "past" => query
                .Where(b => (b.Status == BookingStatus.Confirmed && (
                             (b.ShowId.HasValue && _db.Shows.Any(s => s.Id == b.ShowId && s.ShowDatetime <= now)) ||
                             (b.EventId.HasValue && _db.Events.Any(e => e.Id == b.EventId && e.EventDate <= now)))) ||
                            b.Status == BookingStatus.Cancelled ||
                            b.Status == BookingStatus.Refunded)
                .OrderByDescending(b =>
                    b.ShowId.HasValue
                        ? _db.Shows.Where(s => s.Id == b.ShowId).Select(s => s.ShowDatetime).FirstOrDefault()
                        : _db.Events.Where(e => e.Id == b.EventId).Select(e => e.EventDate ?? DateTime.MinValue).FirstOrDefault()),
            _ => query.OrderByDescending(b => b.CreatedAt)
        };

        var total    = await query.CountAsync(ct);
        var bookings = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        // Pre-load all venues and screens to avoid per-booking round trips
        var allVenues  = (await _venues.GetAllAsync(ct)).ToList();
        var allScreens = (await _screens.GetAllAsync(ct)).ToList();

        var items = new List<BookingListItem>();
        foreach (var b in bookings)
        {
            var show   = b.ShowId.HasValue ? await _shows.GetByIdAsync(b.ShowId.Value, ct) : null;
            var venue  = show is not null ? allVenues.FirstOrDefault(v => v.Id == show.VenueId) : null;
            var screen = show is not null ? allScreens.FirstOrDefault(s => s.Id == show.ScreenId) : null;

            Movie?  movie = null;
            Event?  evt   = null;
            string  title = "Unknown";
            string  slug  = "";
            string? poster        = null;
            string? certificate   = null;
            string? format        = show?.Format;
            string? language      = show?.Language;

            if (show?.MovieId.HasValue == true)
            {
                movie       = await _movies.GetByIdAsync(show.MovieId!.Value, ct);
                title       = movie?.Title ?? "Unknown";
                slug        = movie?.Slug ?? "";
                poster      = movie?.PosterUrl;
                certificate = movie?.Certificate;
            }
            else if (show?.EventId.HasValue == true)
            {
                evt   = await _db.Events.FirstOrDefaultAsync(e => e.Id == show.EventId!.Value, ct);
                title = evt?.Title ?? "Unknown";
                slug  = evt?.Slug  ?? "";
                poster = evt?.PosterUrl;
            }
            else if (b.EventId.HasValue)
            {
                // Direct event booking (no show, has EventId on booking itself)
                evt   = await _db.Events.FirstOrDefaultAsync(e => e.Id == b.EventId!.Value, ct);
                title = evt?.Title ?? "Unknown";
                slug  = evt?.Slug  ?? "";
                poster = evt?.PosterUrl;
                if (evt?.VenueId.HasValue == true)
                    venue = allVenues.FirstOrDefault(v => v.Id == evt.VenueId!.Value);
            }

            var seats = await _db.BookingSeats
                .Where(bs => bs.BookingId == b.Id)
                .Select(bs => new BookingSeatItem(bs.SeatLabel, bs.Category, bs.Price))
                .ToListAsync(ct);

            // Determine event datetime for sorting/cancellation
            DateTime eventDatetime;
            string showDateStr, showTimeStr;
            if (show is not null)
            {
                eventDatetime = show.ShowDatetime;
                showDateStr   = show.ShowDate.ToString("ddd, dd MMM yyyy");
                showTimeStr   = show.ShowTime.ToString("hh\\:mm tt");
            }
            else if (evt?.EventDate.HasValue == true)
            {
                eventDatetime = evt.EventDate.Value;
                showDateStr   = evt.EventDate.Value.ToString("ddd, dd MMM yyyy");
                showTimeStr   = evt.EventDate.Value.ToString("hh:mm tt");
            }
            else
            {
                eventDatetime = DateTime.MinValue;
                showDateStr   = "";
                showTimeStr   = "";
            }

            var minutesLeft = (eventDatetime - now).TotalMinutes;
            var canCancel   = b.Status == BookingStatus.Confirmed && minutesLeft > 120;

            var payment = await _db.Payments.FirstOrDefaultAsync(p => p.BookingId == b.Id, ct);

            items.Add(new BookingListItem(
                Id:             b.Id,
                BookingRef:     b.BookingRef,
                Status:         b.Status.ToString(),
                Title:          title,
                Slug:           slug,
                PosterUrl:      poster,
                Certificate:    certificate,
                Format:         format,
                Language:       language,
                ShowDate:       showDateStr,
                ShowTime:       showTimeStr,
                ShowDatetime:   eventDatetime,
                VenueName:      venue?.Name    ?? "Unknown",
                VenueAddress:   venue?.Address ?? "",
                ScreenName:     b.TierName ?? screen?.Name ?? "Screen",
                Seats:          seats,
                TicketQty:      b.TicketQty,
                TicketAmount:   b.TicketAmount,
                AmountPaid:     b.AmountPaid,
                Discount:       b.Discount,
                NonRefundableAmount: b.ConvenienceFee + b.OfferProcessingFee
                    + b.Cgst + b.Sgst + b.Igst,
                PaymentMethod:  payment?.Method ?? b.PaymentMethodLabel,
                InvoiceUrl:     b.InvoiceUrl,
                QrUrl:          b.QrUrl,
                CanCancel:      canCancel,
                MinutesUntilShow: minutesLeft,
                CreatedAt:      b.CreatedAt));
        }

        return new PaginatedBookings(
            Items:      items,
            Total:      total,
            Page:       page,
            PageSize:   pageSize,
            TotalPages: (int)Math.Ceiling((double)total / pageSize));
    }

    public async Task<CancelResponse> CancelAsync(
        string bookingRef, Guid userId, CancellationToken ct = default)
    {
        var booking = await _db.Bookings
            .FirstOrDefaultAsync(b => b.BookingRef == bookingRef && b.UserId == userId, ct)
            ?? throw new NotFoundException("Booking not found.");

        if (booking.Status != BookingStatus.Confirmed)
            throw new AppException("Cannot cancel this booking.", 400);

        // Event bookings can always be cancelled (no show-time restriction)
        if (booking.ShowId.HasValue)
        {
            var show = await _shows.GetByIdAsync(booking.ShowId.Value, ct)
                ?? throw new NotFoundException("Show not found.");

            if (show.ShowDatetime <= DateTime.UtcNow.AddHours(2))
                throw new AppException("Cannot cancel within 2 hours of show.", 400);
        }
        else if (booking.EventId.HasValue)
        {
            var ev = await _db.Events.FirstOrDefaultAsync(e => e.Id == booking.EventId.Value, ct);
            if (ev?.EventDate.HasValue == true && ev.EventDate.Value <= DateTime.UtcNow.AddHours(2))
                throw new AppException("Cannot cancel within 2 hours of event.", 400);
        }

        // Non-refundable: convenience fee, offer processing fee, and all GST on those fees
        var refundAmount = booking.AmountPaid
            - (booking.ConvenienceFee + booking.OfferProcessingFee
               + booking.Cgst + booking.Sgst + booking.Igst);
        refundAmount = Math.Max(0, Math.Round(refundAmount, 2));

        var refundId = $"MOCK-REF-{Guid.NewGuid():N}";

        var payment = await _db.Payments.FirstOrDefaultAsync(p => p.BookingId == booking.Id, ct);
        if (payment is not null)
        {
            payment.Status       = PaymentStatus.Refunded;
            payment.RefundAmount = refundAmount;
            payment.RefundId     = refundId;
        }

        booking.Status      = BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        var capturedId      = booking.Id;
        var capturedRef     = booking.BookingRef;
        var capturedRefund  = refundAmount;
        _ = Task.Run(async () =>
        {
            await using var scope = _scopeFactory.CreateAsyncScope();
            var notifications = scope.ServiceProvider.GetRequiredService<INotificationService>();
            try { await notifications.SendBookingCancelledAsync(capturedId, capturedRefund); }
            catch (Exception ex) { _logger.LogError(ex, "Cancel notification failed for {Ref}", capturedRef); }
        }, CancellationToken.None);

        return new CancelResponse(booking.BookingRef, refundAmount, refundId,
            $"Booking cancelled. ₹{refundAmount:F2} will be refunded within 7 business days.");
    }

    public async Task<byte[]> GenerateInvoicePdfAsync(
        string bookingRef, Guid userId, CancellationToken ct = default)
    {
        var booking = await _db.Bookings
            .FirstOrDefaultAsync(b => b.BookingRef == bookingRef && b.UserId == userId, ct)
            ?? throw new NotFoundException("Booking not found.");

        var show    = booking.ShowId.HasValue ? await _shows.GetByIdAsync(booking.ShowId.Value, ct) : null;
        var movie   = show?.MovieId.HasValue == true ? await _movies.GetByIdAsync(show.MovieId!.Value, ct) : null;
        var allVenues = await _venues.GetAllAsync(ct);
        var venue   = show is not null ? allVenues.FirstOrDefault(v => v.Id == show.VenueId) : null;
        var payment = await _db.Payments.FirstOrDefaultAsync(p => p.BookingId == booking.Id, ct);
        var user    = await _db.Users.FirstOrDefaultAsync(u => u.Id == booking.UserId, ct)
            ?? throw new NotFoundException("User not found.");

        await using var scope = _scopeFactory.CreateAsyncScope();
        var builder   = scope.ServiceProvider.GetRequiredService<InvoiceBuilder>();
        var generator = scope.ServiceProvider.GetRequiredService<IInvoicePdfGenerator>();

        var model    = await builder.BuildAsync(booking, show, movie, venue, payment, user, ct);
        return generator.Generate(model);
    }

    public async Task<CreateOrderResponse> CreateEventOrderAsync(
        CreateEventOrderRequest req, Guid userId, CancellationToken ct = default)
    {
        // ── Idempotency ──────────────────────────────────────────────────────
        var existing = await _db.IdempotencyKeys
            .FirstOrDefaultAsync(k => k.Key == req.IdempotencyKey, ct);
        if (existing?.Response is not null)
            return JsonSerializer.Deserialize<CreateOrderResponse>(existing.Response, JsonOpts)!;

        // ── Load event ───────────────────────────────────────────────────────
        var ev = await _db.Events.FirstOrDefaultAsync(e => e.Id == req.EventId && e.DeletedAt == null, ct)
            ?? throw new NotFoundException($"Event {req.EventId} not found.");

        if (ev.Status != Domain.Enums.MovieStatus.Published)
            throw new NotFoundException("Event is not available for booking.");

        if (ev.EventDate.HasValue && ev.EventDate.Value <= DateTime.UtcNow)
            throw new AppException("This event has already taken place.", 400);

        // ── Load user ────────────────────────────────────────────────────────
        var user = await _users.GetByIdAsync(userId, ct)
            ?? throw new NotFoundException("User not found.");

        // ── Find tier ────────────────────────────────────────────────────────
        var tiersJson = ev.PriceTiers ?? "[]";
        List<PriceTierJson> tiers;
        try
        {
            tiers = JsonSerializer.Deserialize<List<PriceTierJson>>(tiersJson, JsonOpts) ?? [];
        }
        catch
        {
            tiers = [];
        }

        var tier = tiers.FirstOrDefault(t =>
            string.Equals(t.Name, req.TierName, StringComparison.OrdinalIgnoreCase))
            ?? throw new NotFoundException($"Tier '{req.TierName}' not found in this event.");

        // ── Check availability ───────────────────────────────────────────────
        var booked = await _eventLocks.GetTierBookedQuantityAsync(req.EventId, req.TierName, ct);
        var locked = await _eventLocks.GetTierLockedQuantityAsync(req.EventId, req.TierName, ct);
        var available = Math.Max(0, tier.Capacity - booked - locked);

        if (available < req.Quantity)
            throw new ConflictException(
                $"Only {available} ticket(s) available in {tier.Name}. Please choose fewer.");

        // ── Validate coupon ───────────────────────────────────────────────────
        Coupon? coupon = null;
        if (!string.IsNullOrWhiteSpace(req.CouponCode))
        {
            var ticketTotal = tier.Price * req.Quantity;
            await _couponSvc.ValidateAsync(req.CouponCode, Guid.Empty, userId, (decimal)ticketTotal, ct);
            coupon = await _coupons.FindByCodeAsync(req.CouponCode, ct);
        }

        // ── Calculate pricing ─────────────────────────────────────────────────
        var stateCode = user.StateCode ?? "24";
        var breakdown = await _pricing.CalculateAsync(req.Quantity, (decimal)tier.Price, stateCode, coupon, ct);

        // ── Get lock minutes from settings ────────────────────────────────────
        var allSettings  = await _settings.GetAllAsync(ct);
        var lockMinutes  = double.Parse(allSettings.GetValueOrDefault("seat_lock_minutes", "8"));

        // ── Lock tickets ─────────────────────────────────────────────────────
        await _eventLocks.LockTierAsync(req.EventId, req.TierName, req.Quantity, userId, lockMinutes, ct);

        // ── Persist in transaction ────────────────────────────────────────────
        var strategy = _db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await _db.Database.BeginTransactionAsync(ct);
            try
            {
                var booking = new Booking
                {
                    BookingRef         = GenerateBookingRef(),
                    UserId             = userId,
                    ShowId             = null,
                    EventId            = req.EventId,
                    TierName           = req.TierName,
                    TicketQty          = req.Quantity,
                    TicketAmount       = breakdown.TicketAmount,
                    ConvenienceFee     = breakdown.ConvenienceFee,
                    OfferProcessingFee = breakdown.OfferProcessingFee,
                    TaxableAmount      = breakdown.TaxableAmount,
                    Cgst               = breakdown.Cgst,
                    Sgst               = breakdown.Sgst,
                    Igst               = breakdown.Igst,
                    Discount           = breakdown.Discount,
                    AmountPaid         = breakdown.AmountPaid,
                    CustomerStateCode  = stateCode,
                    CouponId           = coupon?.Id,
                    Status             = BookingStatus.Pending,
                };
                await _db.Bookings.AddAsync(booking, ct);

                if (coupon != null)
                {
                    coupon.CurrentUsage++;
                    _db.Coupons.Update(coupon);
                    await _db.CouponUsages.AddAsync(new CouponUsage
                    {
                        CouponId  = coupon.Id,
                        UserId    = userId,
                        BookingId = booking.Id,
                    }, ct);
                }

                var providerOrderId = $"MOCK-{Guid.NewGuid():N}";
                await _db.Payments.AddAsync(new PaymentEntity
                {
                    BookingId       = booking.Id,
                    Provider        = PaymentProvider.Mock,
                    ProviderOrderId = providerOrderId,
                    Amount          = breakdown.AmountPaid,
                    Currency        = "INR",
                    Status          = PaymentStatus.Created,
                    IdempotencyKey  = req.IdempotencyKey,
                }, ct);

                await _db.SaveChangesAsync(ct);

                var response = new CreateOrderResponse(
                    booking.Id, booking.BookingRef, providerOrderId,
                    "mock", breakdown.AmountPaid, "INR", breakdown);

                await _db.IdempotencyKeys.AddAsync(new IdempotencyKey
                {
                    Key        = req.IdempotencyKey,
                    UserId     = userId,
                    Endpoint   = "/api/events/order",
                    Response   = JsonSerializer.Serialize(response, JsonOpts),
                    StatusCode = 200,
                }, ct);
                await _db.SaveChangesAsync(ct);

                await tx.CommitAsync(ct);
                _logger.LogInformation("Event order {Ref} created for user {UserId}", booking.BookingRef, userId);
                return response;
            }
            catch
            {
                await tx.RollbackAsync(ct);
                throw;
            }
        });
    }

    public async Task<BookingDetailResponse> FinalizeEventBookingAsync(
        Guid bookingId, string providerPaymentId, CancellationToken ct = default)
    {
        var booking = await _db.Bookings
            .FirstOrDefaultAsync(b => b.Id == bookingId, ct)
            ?? throw new NotFoundException("Booking not found.");

        if (booking.Status != BookingStatus.Pending)
            throw new ConflictException("Booking already processed.");

        PaymentEntity? finalPayment = null;

        var strategy = _db.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await _db.Database.BeginTransactionAsync(ct);
            try
            {
                // a. Update payment
                var payment = await _db.Payments.FirstOrDefaultAsync(p => p.BookingId == bookingId, ct);
                if (payment is not null)
                {
                    payment.ProviderPaymentId = providerPaymentId;
                    payment.Status            = PaymentStatus.Captured;
                    payment.CapturedAt        = DateTime.UtcNow;
                    payment.Method            = "mock";
                }
                finalPayment = payment;

                // b. Confirm booking
                booking.Status = BookingStatus.Confirmed;

                // c. Release event ticket locks
                if (booking.EventId.HasValue && booking.UserId != Guid.Empty)
                    await _eventLocks.ReleaseLocksForUserAsync(booking.UserId, booking.EventId.Value, ct);

                // d. Invoice number
                booking.InvoiceNumber = $"TIN{DateTime.UtcNow:yy}{booking.Id:N}"[..14].ToUpper();

                // e. QR code (best-effort)
                try
                {
                    var qrBytes = GenerateQr(booking.BookingRef);
                    var qrUrl   = await _storage.UploadQrAsync(booking.BookingRef, qrBytes, ct);
                    if (qrUrl is not null) booking.QrUrl = qrUrl;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "QR upload failed for {Ref} — continuing", booking.BookingRef);
                }

                await _db.SaveChangesAsync(ct);
                await tx.CommitAsync(ct);
                _logger.LogInformation("Event booking finalized: {Ref}", booking.BookingRef);
            }
            catch
            {
                await tx.RollbackAsync(ct);
                throw;
            }
        });

        // Fire-and-forget notification
        var capturedId  = booking.Id;
        var capturedRef = booking.BookingRef;
        _ = Task.Run(async () =>
        {
            await using var scope = _scopeFactory.CreateAsyncScope();
            var notifications = scope.ServiceProvider.GetRequiredService<INotificationService>();
            try
            {
                await notifications.SendBookingConfirmedAsync(capturedId);
                _logger.LogInformation("Notification sent for event booking {Ref}", capturedRef);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Notification failed for event booking {Ref}", capturedRef);
            }
        }, CancellationToken.None);

        return await BuildEventDetailAsync(booking, finalPayment, ct);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<BookingDetailResponse> BuildDetailAsync(
        Booking booking, PaymentEntity? payment, List<string> seatLabels, CancellationToken ct)
    {
        var show     = booking.ShowId.HasValue ? await _shows.GetByIdAsync(booking.ShowId.Value, ct) : null;
        var allVenues  = await _venues.GetAllAsync(ct);
        var venue    = show is not null ? allVenues.FirstOrDefault(v => v.Id == show?.VenueId) : null;
        var allScreens = await _screens.GetAllAsync(ct);
        var screen   = show is not null ? allScreens.FirstOrDefault(s => s.Id == show?.ScreenId) : null;
        var movie    = show?.MovieId.HasValue == true
            ? await _movies.GetByIdAsync(show.MovieId!.Value, ct) : null;

        var bsItems  = await _db.BookingSeats
            .Where(bs => bs.BookingId == booking.Id)
            .ToListAsync(ct);

        var seatItems = bsItems.Select(bs =>
            new BookingSeatItem(bs.SeatLabel, bs.Category, bs.Price)).ToList();

        var pricing = new PricingBreakdown(
            booking.TicketAmount,
            booking.ConvenienceFee,
            Math.Round(booking.ConvenienceFee * 0.18m, 2),
            booking.OfferProcessingFee,
            Math.Round(booking.OfferProcessingFee * 0.18m, 2),
            booking.TaxableAmount,
            booking.Cgst,
            booking.Sgst,
            booking.Igst,
            booking.Discount,
            booking.AmountPaid,
            booking.CustomerStateCode == "24");

        var movieCity = venue is not null
            ? (await _venues.GetAllAsync(ct)).FirstOrDefault(v => v.Id == venue.Id)?.CityId.ToString() ?? ""
            : "";

        return new BookingDetailResponse(
            BookingRef:    booking.BookingRef,
            Status:        booking.Status.ToString(),
            CreatedAt:     booking.CreatedAt,
            Movie: new BookingMovieInfo(
                Title:       movie?.Title ?? "Unknown",
                Slug:        movie?.Slug ?? "",
                PosterUrl:   movie?.PosterUrl,
                Certificate: movie?.Certificate,
                Format:      show?.Format,
                Language:    show?.Language),
            Show: new BookingShowInfo(
                Date:       show?.ShowDate.ToString("yyyy-MM-dd") ?? "",
                Time:       show?.ShowTime.ToString(@"hh\:mm tt") ?? "",
                VenueName:  venue?.Name ?? "Unknown",
                ScreenName: screen?.Name ?? "Screen",
                City:       movieCity),
            Seats:   seatItems,
            Pricing: pricing,
            Payment: new BookingPaymentInfo(
                Method:             payment?.Method,
                CapturedAt:         payment?.CapturedAt,
                ProviderPaymentId:  payment?.ProviderPaymentId),
            QrUrl:         booking.QrUrl,
            InvoiceUrl:    booking.InvoiceUrl,
            InvoiceNumber: booking.InvoiceNumber,
            BookingId:     booking.Id);
    }

    private async Task<BookingDetailResponse> BuildEventDetailAsync(
        Booking booking, PaymentEntity? payment, CancellationToken ct)
    {
        var ev      = booking.EventId.HasValue
            ? await _db.Events.FirstOrDefaultAsync(e => e.Id == booking.EventId.Value, ct)
            : null;
        var allVenues = await _venues.GetAllAsync(ct);
        var venue     = ev?.VenueId.HasValue == true
            ? allVenues.FirstOrDefault(v => v.Id == ev.VenueId!.Value)
            : null;

        var eventDate = ev?.EventDate;
        var dateLabel = eventDate.HasValue
            ? eventDate.Value.ToString("ddd, dd MMM yyyy")
            : "";
        var timeLabel = eventDate.HasValue
            ? eventDate.Value.ToString("hh\\:mm tt")
            : "";

        var pricing = new PricingBreakdown(
            booking.TicketAmount,
            booking.ConvenienceFee,
            Math.Round(booking.ConvenienceFee * 0.18m, 2),
            booking.OfferProcessingFee,
            Math.Round(booking.OfferProcessingFee * 0.18m, 2),
            booking.TaxableAmount,
            booking.Cgst,
            booking.Sgst,
            booking.Igst,
            booking.Discount,
            booking.AmountPaid,
            booking.CustomerStateCode == "24");

        return new BookingDetailResponse(
            BookingRef:    booking.BookingRef,
            Status:        booking.Status.ToString(),
            CreatedAt:     booking.CreatedAt,
            Movie: new BookingMovieInfo(
                Title:       ev?.Title ?? "Event",
                Slug:        ev?.Slug ?? "",
                PosterUrl:   ev?.PosterUrl,
                Certificate: null,
                Format:      null,
                Language:    ev?.Language),
            Show: new BookingShowInfo(
                Date:       dateLabel,
                Time:       timeLabel,
                VenueName:  venue?.Name ?? "Venue",
                ScreenName: booking.TierName ?? "General",
                City:       ""),
            Seats:   [],
            Pricing: pricing,
            Payment: new BookingPaymentInfo(
                Method:            payment?.Method,
                CapturedAt:        payment?.CapturedAt,
                ProviderPaymentId: payment?.ProviderPaymentId),
            QrUrl:         booking.QrUrl,
            InvoiceUrl:    booking.InvoiceUrl,
            InvoiceNumber: booking.InvoiceNumber,
            BookingId:     booking.Id);
    }

    private static byte[] GenerateQr(string text)
    {
        using var gen  = new QRCodeGenerator();
        var data       = gen.CreateQrCode(text, QRCodeGenerator.ECCLevel.Q);
        using var code = new PngByteQRCode(data);
        return code.GetGraphic(20);
    }

    private static string GenerateBookingRef()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var suffix = new string(Enumerable.Range(0, 6)
            .Select(_ => chars[Random.Shared.Next(chars.Length)]).ToArray());
        return $"BK{DateTime.UtcNow:yyyyMMdd}{suffix}";
    }

    private record PriceTierJson(string Name, double Price, int Capacity, string Color);
}
