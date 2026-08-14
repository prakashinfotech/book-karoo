using System.Text.Json;
using BookKaroo.Application.DTOs.Booking;
using BookKaroo.Application.DTOs.Payment;
using BookKaroo.Application.DTOs.Pricing;
using PaymentEntity = BookKaroo.Domain.Entities.Payment;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BookKaroo.Infrastructure.Services;

public class PaymentService : IPaymentService
{
    private readonly IShowRepository         _shows;
    private readonly IUserRepository         _users;
    private readonly ISeatLockRepository     _locks;
    private readonly ICouponRepository       _coupons;
    private readonly IRepository<Screen>     _screens;
    private readonly IPricingService         _pricing;
    private readonly ICouponService          _couponSvc;
    private readonly IBookingService         _bookingSvc;
    private readonly IPaymentProvider        _paymentProvider;
    private readonly BookKarooDbContext      _db;
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(
        IShowRepository      shows,
        IUserRepository      users,
        ISeatLockRepository  locks,
        ICouponRepository    coupons,
        IRepository<Screen>  screens,
        IPricingService      pricing,
        ICouponService       couponSvc,
        IBookingService      bookingSvc,
        IPaymentProvider     paymentProvider,
        BookKarooDbContext   db,
        ILogger<PaymentService> logger)
    {
        _shows           = shows;
        _users           = users;
        _locks           = locks;
        _coupons         = coupons;
        _screens         = screens;
        _pricing         = pricing;
        _couponSvc       = couponSvc;
        _bookingSvc      = bookingSvc;
        _paymentProvider = paymentProvider;
        _db              = db;
        _logger          = logger;
    }

    public async Task<CreateOrderResponse> CreateOrderAsync(
        CreateOrderRequest request, Guid userId, CancellationToken ct = default)
    {
        // ── Idempotency ──────────────────────────────────────────────────────
        var existing = await _db.IdempotencyKeys
            .FirstOrDefaultAsync(k => k.Key == request.IdempotencyKey, ct);
        if (existing?.Response is not null)
        {
            return JsonSerializer.Deserialize<CreateOrderResponse>(existing.Response,
                JsonOpts)!;
        }

        // ── Load show & user ─────────────────────────────────────────────────
        var show = await _shows.GetByIdAsync(request.ShowId, ct)
            ?? throw new NotFoundException($"Show {request.ShowId} not found.");

        var user = await _users.GetByIdAsync(userId, ct)
            ?? throw new NotFoundException("User not found.");

        // ── Validate seats still locked by this user ─────────────────────────
        var activeLocks = (await _locks.GetActiveLocksAsync(request.ShowId, ct))
            .Where(l => l.UserId == userId)
            .Select(l => l.SeatLabel)
            .ToHashSet();

        var requestedSeats = request.Seats.ToHashSet();
        if (!requestedSeats.IsSubsetOf(activeLocks))
        {
            var missing = string.Join(", ", requestedSeats.Except(activeLocks));
            throw new ConflictException($"Seat lock expired for: {missing}. Please reselect seats.");
        }

        // ── Resolve seat price ────────────────────────────────────────────────
        var allScreens = await _screens.GetAllAsync(ct);
        var screen     = allScreens.FirstOrDefault(s => s.Id == show.ScreenId);
        var overrides  = ParseJson<Dictionary<string, decimal>>(show.PriceOverrides);
        var seatPrice  = ResolveSeatPrice(request.Seats, screen, overrides);

        // ── Validate coupon ───────────────────────────────────────────────────
        Coupon? coupon = null;
        if (!string.IsNullOrWhiteSpace(request.CouponCode))
        {
            var ticketAmount = seatPrice * request.Seats.Length;
            await _couponSvc.ValidateAsync(request.CouponCode, request.ShowId, userId, ticketAmount, ct);
            coupon = await _coupons.FindByCodeAsync(request.CouponCode, ct);
        }

        // ── Calculate pricing ─────────────────────────────────────────────────
        var stateCode = user.StateCode ?? "24";
        var breakdown = await _pricing.CalculateAsync(request.Seats.Length, seatPrice, stateCode, coupon, ct);

        // ── Persist in transaction (wrapped in execution strategy for Npgsql retry) ─
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
                    ShowId             = request.ShowId,
                    TicketQty          = request.Seats.Length,
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

                foreach (var seat in request.Seats)
                {
                    await _db.BookingSeats.AddAsync(new BookingSeat
                    {
                        BookingId = booking.Id,
                        SeatLabel = seat,
                        Category  = GetSeatCategory(seat, screen),
                        Price     = seatPrice,
                    }, ct);
                }

                var providerOrder = await _paymentProvider.CreateOrderAsync(
                    new ProviderOrderRequest(breakdown.AmountPaid, "INR"), ct);
                var providerOrderId = providerOrder.ProviderOrderId;

                var providerEnum = _paymentProvider.ProviderName.ToLowerInvariant() switch
                {
                    "razorpay" => PaymentProvider.Razorpay,
                    _          => PaymentProvider.Mock,
                };

                await _db.Payments.AddAsync(new PaymentEntity
                {
                    BookingId       = booking.Id,
                    Provider        = providerEnum,
                    ProviderOrderId = providerOrderId,
                    Amount          = breakdown.AmountPaid,
                    Currency        = "INR",
                    Status          = PaymentStatus.Created,
                    IdempotencyKey  = request.IdempotencyKey,
                }, ct);

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

                await _db.SaveChangesAsync(ct);

                var response = new CreateOrderResponse(
                    booking.Id, booking.BookingRef, providerOrderId,
                    _paymentProvider.ProviderName, breakdown.AmountPaid, "INR", breakdown,
                    RazorpayKeyId: providerOrder.RazorpayKeyId);

                await _db.IdempotencyKeys.AddAsync(new IdempotencyKey
                {
                    Key        = request.IdempotencyKey,
                    UserId     = userId,
                    Endpoint   = "/api/payments/order",
                    Response   = JsonSerializer.Serialize(response, JsonOpts),
                    StatusCode = 200,
                }, ct);
                await _db.SaveChangesAsync(ct);

                await tx.CommitAsync(ct);
                _logger.LogInformation("Order {Ref} created for user {UserId}", booking.BookingRef, userId);
                return response;
            }
            catch
            {
                await tx.RollbackAsync(ct);
                throw;
            }
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static readonly JsonSerializerOptions JsonOpts =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private static decimal ResolveSeatPrice(
        string[] seats, Screen? screen, Dictionary<string, decimal>? overrides)
    {
        if (screen?.Layout is not null)
        {
            try
            {
                var layout = ParseJson<LayoutJson>(screen.Layout);
                if (layout?.Categories is { Length: > 0 })
                {
                    var total = 0m;
                    foreach (var seat in seats)
                    {
                        var row = seat.Length > 0 ? seat[..1] : "G";
                        var cat = layout.Categories.FirstOrDefault(c =>
                            c.Rows?.Contains(row, StringComparer.OrdinalIgnoreCase) == true);
                        total += cat?.Price ?? FallbackPrice(seat);
                    }
                    return seats.Length > 0 ? Math.Round(total / seats.Length, 2) : 260m;
                }
            }
            catch { /* fall through */ }
        }

        // No screen layout — mirror the frontend FALLBACK_LAYOUT row-to-price mapping
        if (seats.Length == 0) return 260m;
        var avg = seats.Sum(FallbackPrice) / seats.Length;
        return Math.Round(avg, 2);
    }

    private static string GetSeatCategory(string seat, Screen? screen)
    {
        if (screen?.Layout is not null)
        {
            try
            {
                var layout = ParseJson<LayoutJson>(screen.Layout);
                var row    = seat.Length > 0 ? seat[..1] : "G";
                var name   = layout?.Categories?
                    .FirstOrDefault(c => c.Rows?.Contains(row, StringComparer.OrdinalIgnoreCase) == true)
                    ?.Name?.ToLower();
                if (name is not null) return name;
            }
            catch { /* fall through */ }
        }
        return FallbackCategory(seat);
    }

    // Mirrors frontend FALLBACK_LAYOUT: A-B=Recliner(650), C-F=Executive(420), G-L=Normal(260)
    private static decimal FallbackPrice(string seat)
    {
        var row = seat.Length > 0 ? char.ToUpper(seat[0]) : 'G';
        return row switch
        {
            'A' or 'B'                   => 650m,
            'C' or 'D' or 'E' or 'F'    => 420m,
            _                            => 260m,
        };
    }

    private static string FallbackCategory(string seat)
    {
        var row = seat.Length > 0 ? char.ToUpper(seat[0]) : 'G';
        return row switch
        {
            'A' or 'B'                => "recliner",
            'C' or 'D' or 'E' or 'F' => "executive",
            _                         => "normal",
        };
    }

    private static T? ParseJson<T>(string? json) where T : class
    {
        if (json is null) return null;
        try { return JsonSerializer.Deserialize<T>(json, JsonOpts); }
        catch { return null; }
    }

    private static string GenerateBookingRef()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var suffix = new string(Enumerable.Range(0, 6)
            .Select(_ => chars[Random.Shared.Next(chars.Length)]).ToArray());
        return $"BK{DateTime.UtcNow:yyyyMMdd}{suffix}";
    }

    public async Task<BookingDetailResponse> MockCaptureAsync(
        string providerOrderId, Guid userId, bool simulateFailure, CancellationToken ct = default)
    {
        var payment = await _db.Payments
            .FirstOrDefaultAsync(p => p.ProviderOrderId == providerOrderId, ct)
            ?? throw new NotFoundException("Order not found.");

        var booking = await _db.Bookings
            .FirstOrDefaultAsync(b => b.Id == payment.BookingId, ct)
            ?? throw new NotFoundException("Booking not found.");

        if (booking.UserId != userId)
            throw new ForbiddenException("You do not own this booking.");

        if (simulateFailure)
        {
            payment.Status = PaymentStatus.Failed;
            await _db.SaveChangesAsync(ct);
            throw new AppException("Payment declined (simulated).", 402);
        }

        var providerPaymentId = $"MOCK-PAY-{Guid.NewGuid():N}";

        if (booking.ShowId.HasValue)
            return await _bookingSvc.FinalizeBookingAsync(booking.Id, providerPaymentId, ct);
        else if (booking.EventId.HasValue)
            return await _bookingSvc.FinalizeEventBookingAsync(booking.Id, providerPaymentId, ct);
        else
            throw new InvalidOperationException("Booking has neither ShowId nor EventId.");
    }

    public async Task<BookingDetailResponse> VerifyPaymentAsync(
        VerifyPaymentRequest request, CancellationToken ct = default)
    {
        // Verify HMAC signature using RazorpayPaymentProvider
        if (_paymentProvider is not BookKaroo.Infrastructure.Payment.RazorpayPaymentProvider razorpay)
            throw new AppException("Verify endpoint only available for Razorpay provider.", 400);

        if (!razorpay.VerifyPaymentSignature(
                request.RazorpayOrderId, request.RazorpayPaymentId, request.RazorpaySignature))
        {
            throw new AppException("Payment verification failed. Invalid signature.", 400);
        }

        // Find payment record
        var payment = await _db.Payments
            .FirstOrDefaultAsync(p => p.ProviderOrderId == request.RazorpayOrderId, ct)
            ?? throw new NotFoundException("Payment order not found.");

        // Idempotency — already captured?
        if (payment.Status == PaymentStatus.Captured)
        {
            var existingBooking = await _db.Bookings
                .FirstOrDefaultAsync(b => b.Id == payment.BookingId, ct)
                ?? throw new NotFoundException("Booking not found.");

            if (existingBooking.ShowId.HasValue)
                return await _bookingSvc.FinalizeBookingAsync(existingBooking.Id, payment.ProviderPaymentId!, ct);
            else if (existingBooking.EventId.HasValue)
                return await _bookingSvc.FinalizeEventBookingAsync(existingBooking.Id, payment.ProviderPaymentId!, ct);
            else
                throw new InvalidOperationException("Booking has neither ShowId nor EventId.");
        }

        // Store provider payment ID and signature
        payment.ProviderPaymentId = request.RazorpayPaymentId;
        payment.ProviderSignature = request.RazorpaySignature;
        await _db.SaveChangesAsync(ct);

        // Find booking and finalize
        var booking = await _db.Bookings
            .FirstOrDefaultAsync(b => b.Id == payment.BookingId, ct)
            ?? throw new NotFoundException("Booking not found.");

        if (booking.ShowId.HasValue)
            return await _bookingSvc.FinalizeBookingAsync(booking.Id, request.RazorpayPaymentId, ct);
        else if (booking.EventId.HasValue)
            return await _bookingSvc.FinalizeEventBookingAsync(booking.Id, request.RazorpayPaymentId, ct);
        else
            throw new InvalidOperationException("Booking has neither ShowId nor EventId.");
    }

    private record LayoutJson(LayoutCategory[]? Categories);
    private record LayoutCategory(string? Name, string[]? Rows, decimal Price);
}
