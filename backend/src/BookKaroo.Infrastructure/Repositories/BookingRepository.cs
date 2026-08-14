using BookKaroo.Application.DTOs.Admin;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using PaymentEntity = BookKaroo.Domain.Entities.Payment;

namespace BookKaroo.Infrastructure.Repositories;

public class BookingRepository : Repository<Booking>, IBookingRepository
{
    public BookingRepository(BookKarooDbContext db) : base(db) { }

    public async Task<IEnumerable<Booking>> GetByUserAsync(Guid userId, CancellationToken ct = default) =>
        await _db.Bookings.Where(b => b.UserId == userId).OrderByDescending(b => b.CreatedAt).ToListAsync(ct);

    public async Task<Booking?> GetByRefAsync(string bookingRef, CancellationToken ct = default) =>
        await _db.Bookings.FirstOrDefaultAsync(b => b.BookingRef == bookingRef, ct);

    public async Task<IEnumerable<Booking>> GetByShowAsync(Guid showId, CancellationToken ct = default) =>
        await _db.Bookings.Where(b => b.ShowId == showId).ToListAsync(ct);

    public async Task<bool> IsSeatBookedAsync(Guid showId, string seatLabel, CancellationToken ct = default) =>
        await (
            from bs in _db.BookingSeats
            join b in _db.Bookings.Where(b => b.ShowId == showId && b.Status == BookingStatus.Confirmed)
                on bs.BookingId equals b.Id
            where bs.SeatLabel == seatLabel
            select bs.Id
        ).AnyAsync(ct);

    // ── Admin ─────────────────────────────────────────────────────────────────

    public async Task<(List<AdminBookingDto> Items, int Total)> GetAllAdminAsync(
        string?  search,
        string?  status,
        Guid?    movieId,
        Guid?    cityId,
        DateOnly? fromDate,
        DateOnly? toDate,
        int      page,
        int      pageSize,
        CancellationToken ct = default)
    {
        // 1. Build base booking query — all DB-side filters applied here
        var bookingQuery = _db.Bookings.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<BookingStatus>(status, ignoreCase: true, out var statusEnum))
            bookingQuery = bookingQuery.Where(b => b.Status == statusEnum);

        // Date filter on booking.CreatedAt (not show date) so future-show bookings are not excluded
        if (fromDate.HasValue)
        {
            var fromDt = fromDate.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            bookingQuery = bookingQuery.Where(b => b.CreatedAt >= fromDt);
        }
        if (toDate.HasValue)
        {
            var toDt = toDate.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            bookingQuery = bookingQuery.Where(b => b.CreatedAt <= toDt);
        }

        var allBookings = await bookingQuery
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(ct);

        var bookingIds = allBookings.Select(b => b.Id).ToList();
        var showIds    = allBookings.Select(b => b.ShowId).Distinct().ToList();
        var userIds    = allBookings.Select(b => b.UserId).Distinct().ToList();

        // 2. Load related data sequentially (no Task.WhenAll — shared DbContext)
        //    Materialize local ID lists before passing to EF Core Contains to avoid translation errors
        var shows   = await _db.Shows.Where(s => showIds.Contains(s.Id)).ToListAsync(ct);
        var users   = await _db.Users.Where(u => userIds.Contains(u.Id)).ToListAsync(ct);

        var movieIds  = shows.Where(s => s.MovieId.HasValue).Select(s => s.MovieId!.Value).Distinct().ToList();
        var eventIds  = shows.Where(s => s.EventId.HasValue).Select(s => s.EventId!.Value).Distinct().ToList();
        var venueIds  = shows.Select(s => s.VenueId).Distinct().ToList();
        var screenIds = shows.Select(s => s.ScreenId).Distinct().ToList();

        var movies  = movieIds.Count  > 0 ? await _db.Movies .Where(m => movieIds .Contains(m.Id)).ToListAsync(ct) : new List<Movie>();
        var events  = eventIds.Count  > 0 ? await _db.Events .Where(e => eventIds .Contains(e.Id)).ToListAsync(ct) : new List<Event>();
        var venues  = venueIds.Count  > 0 ? await _db.Venues .Where(v => venueIds .Contains(v.Id)).ToListAsync(ct) : new List<Venue>();
        var screens = screenIds.Count > 0 ? await _db.Screens.Where(s => screenIds.Contains(s.Id)).ToListAsync(ct) : new List<Screen>();

        var cityIds = venues.Select(v => v.CityId).Distinct().ToList();
        var cities  = cityIds.Count > 0 ? await _db.Cities.Where(c => cityIds.Contains(c.Id)).ToListAsync(ct) : new List<City>();
        var payments = await _db.Payments.Where(p => bookingIds.Contains(p.BookingId)).ToListAsync(ct);
        var bookingSeats = await _db.BookingSeats.Where(bs => bookingIds.Contains(bs.BookingId)).ToListAsync(ct);

        // 3. Build lookup dicts
        var showDict   = shows  .ToDictionary(s => s.Id);
        var userDict   = users  .ToDictionary(u => u.Id);
        var movieDict  = movies .ToDictionary(m => m.Id);
        var eventDict  = events .ToDictionary(e => e.Id);
        var venueDict  = venues .ToDictionary(v => v.Id);
        var screenDict = screens.ToDictionary(s => s.Id);
        var cityDict   = cities .ToDictionary(c => c.Id);
        var paymentDict = payments.GroupBy(p => p.BookingId).ToDictionary(g => g.Key, g => g.First());
        var seatsByBooking = bookingSeats.GroupBy(bs => bs.BookingId).ToDictionary(g => g.Key, g => g.ToList());

        // 4. Merge into DTOs and apply remaining filters (search, movieId, cityId, dates)
        var merged = new List<AdminBookingDto>();
        foreach (var b in allBookings)
        {
            if (!b.ShowId.HasValue || !showDict.TryGetValue(b.ShowId.Value, out var show)) continue;
            if (!userDict.TryGetValue(b.UserId, out var user)) continue;
            if (!venueDict.TryGetValue(show.VenueId, out var venue)) continue;
            if (!cityDict.TryGetValue(venue.CityId, out var city)) continue;

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.ToLower();
                if (!b.BookingRef.ToLower().Contains(q) &&
                    !user.Name.ToLower().Contains(q) &&
                    !user.Email.ToLower().Contains(q))
                    continue;
            }

            // Apply movieId filter
            if (movieId.HasValue && show.MovieId != movieId) continue;

            // Apply cityId filter
            if (cityId.HasValue && city.Id != cityId) continue;

            var movie  = show.MovieId.HasValue  && movieDict .TryGetValue(show.MovieId.Value,  out var m) ? m : null;
            var ev     = show.EventId.HasValue  && eventDict .TryGetValue(show.EventId.Value,  out var e) ? e : null;
            screenDict.TryGetValue(show.ScreenId, out var screen);
            paymentDict.TryGetValue(b.Id, out var payment);
            seatsByBooking.TryGetValue(b.Id, out var seats);

            var seatsSummary = seats != null && seats.Count > 0
                ? string.Join(", ", seats.OrderBy(s => s.SeatLabel).Select(s => $"{s.SeatLabel}({s.Category})"))
                : string.Empty;

            var showDateLabel = show.ShowDate.ToString("ddd, dd MMM yyyy");
            var showTimeLabel = show.ShowTime.ToString("hh:mm tt");

            merged.Add(new AdminBookingDto(
                Id:                 b.Id,
                BookingRef:         b.BookingRef,
                Status:             b.Status.ToString(),
                AmountPaid:         b.AmountPaid,
                Discount:           b.Discount,
                TicketQty:          b.TicketQty,
                ConvenienceFee:     b.ConvenienceFee,
                Cgst:               b.Cgst,
                Sgst:               b.Sgst,
                Igst:               b.Igst,
                OfferProcessingFee: b.OfferProcessingFee,
                CreatedAt:          b.CreatedAt,
                CancelledAt:        b.CancelledAt,
                InvoiceUrl:         b.InvoiceUrl,
                QrUrl:              b.QrUrl,
                InvoiceNumber:      b.InvoiceNumber,
                UserId:             b.UserId,
                UserName:           user.Name,
                UserEmail:          user.Email,
                UserMobile:         user.Mobile,
                MovieTitle:         movie?.Title,
                PosterUrl:          movie?.PosterUrl,
                EventTitle:         ev?.Title,
                ShowDate:           show.ShowDate,
                ShowDateLabel:      showDateLabel,
                ShowTimeLabel:      showTimeLabel,
                Format:             show.Format,
                Language:           show.Language,
                VenueName:          venue.Name,
                ScreenName:         screen?.Name ?? string.Empty,
                CityName:           city.Name,
                PaymentMethod:      payment?.Method,
                ProviderPaymentId:  payment?.ProviderPaymentId,
                PaymentStatus:      payment?.Status.ToString() ?? "None",
                RefundAmount:       payment?.RefundAmount,
                RefundId:           payment?.RefundId,
                SeatsSummary:       seatsSummary));
        }

        var total  = merged.Count;
        var paged  = merged.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return (paged, total);
    }

    public async Task<AdminBookingDto?> GetBookingDetailAdminAsync(string bookingRef, CancellationToken ct = default)
    {
        var (items, _) = await GetAllAdminAsync(
            search:   bookingRef,
            status:   null,
            movieId:  null,
            cityId:   null,
            fromDate: null,
            toDate:   null,
            page:     1,
            pageSize: 1,
            ct:       ct);

        return items.FirstOrDefault(i => i.BookingRef == bookingRef);
    }

    public async Task<(Booking booking, decimal refundAmount, string? refundId)> AdminCancelBookingAsync(
        Guid bookingId, CancellationToken ct = default)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId, ct)
            ?? throw new KeyNotFoundException($"Booking {bookingId} not found.");

        if (booking.Status != BookingStatus.Confirmed && booking.Status != BookingStatus.Pending)
            throw new InvalidOperationException($"Cannot cancel booking with status: {booking.Status}");

        booking.Status      = BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;

        decimal refundAmt = 0m;
        string? refundId  = null;

        var payment = await _db.Payments.FirstOrDefaultAsync(p => p.BookingId == bookingId, ct);
        if (payment != null)
        {
            refundAmt = booking.AmountPaid - booking.ConvenienceFee - booking.Cgst - booking.Sgst - booking.Igst - booking.OfferProcessingFee;
            if (refundAmt < 0) refundAmt = 0;

            payment.Status       = PaymentStatus.Refunded;
            payment.RefundAmount = refundAmt;
            payment.RefundId     = "MOCK-REF-" + Guid.NewGuid().ToString("N")[..8].ToUpper();
            refundId             = payment.RefundId;
        }

        await _db.SaveChangesAsync(ct);
        return (booking, refundAmt, refundId);
    }

    public async Task<(string refundId, decimal refundAmount)> AdminProcessRefundAsync(
        Guid bookingId, decimal refundAmount, CancellationToken ct = default)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == bookingId, ct)
            ?? throw new KeyNotFoundException($"Booking {bookingId} not found.");

        if (refundAmount <= 0 || refundAmount > booking.AmountPaid)
            throw new ArgumentException($"Invalid refund amount: {refundAmount}");

        var payment = await _db.Payments.FirstOrDefaultAsync(p => p.BookingId == bookingId, ct)
            ?? throw new KeyNotFoundException($"Payment for booking {bookingId} not found.");

        payment.Status       = PaymentStatus.Refunded;
        payment.RefundAmount = refundAmount;
        payment.RefundId     = "MOCK-REF-" + Guid.NewGuid().ToString("N")[..8].ToUpper();

        await _db.SaveChangesAsync(ct);
        return (payment.RefundId!, refundAmount);
    }

    public async Task<List<AdminBookingDto>> GetAllForReportAsync(
        DateOnly fromDate, DateOnly toDate,
        Guid? cityId, Guid? movieId, Guid? venueId,
        CancellationToken ct = default)
    {
        var fromDt = fromDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var toDt   = toDate.ToDateTime(TimeOnly.MaxValue,   DateTimeKind.Utc);

        var allBookings = await _db.Bookings
            .Where(b => b.CreatedAt >= fromDt && b.CreatedAt <= toDt)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(ct);

        if (allBookings.Count == 0) return [];

        var bookingIds = allBookings.Select(b => b.Id).ToList();
        var showIds    = allBookings.Select(b => b.ShowId).Distinct().ToList();
        var userIds    = allBookings.Select(b => b.UserId).Distinct().ToList();

        var shows   = await _db.Shows.Where(s => showIds.Contains(s.Id)).ToListAsync(ct);
        var users   = await _db.Users.Where(u => userIds.Contains(u.Id)).ToListAsync(ct);

        var movieIds  = shows.Where(s => s.MovieId.HasValue).Select(s => s.MovieId!.Value).Distinct().ToList();
        var eventIds  = shows.Where(s => s.EventId.HasValue).Select(s => s.EventId!.Value).Distinct().ToList();
        var venueIds  = shows.Select(s => s.VenueId).Distinct().ToList();
        var screenIds = shows.Select(s => s.ScreenId).Distinct().ToList();

        var movies  = movieIds.Count  > 0 ? await _db.Movies .Where(m => movieIds .Contains(m.Id)).ToListAsync(ct) : [];
        var events  = eventIds.Count  > 0 ? await _db.Events .Where(e => eventIds .Contains(e.Id)).ToListAsync(ct) : [];
        var venues  = venueIds.Count  > 0 ? await _db.Venues .Where(v => venueIds .Contains(v.Id)).ToListAsync(ct) : [];
        var screens = screenIds.Count > 0 ? await _db.Screens.Where(s => screenIds.Contains(s.Id)).ToListAsync(ct) : [];

        var cityIds = venues.Select(v => v.CityId).Distinct().ToList();
        var cities  = cityIds.Count > 0 ? await _db.Cities.Where(c => cityIds.Contains(c.Id)).ToListAsync(ct) : [];

        var showDict   = shows  .ToDictionary(s => s.Id);
        var userDict   = users  .ToDictionary(u => u.Id);
        var movieDict  = movies .ToDictionary(m => m.Id);
        var eventDict  = events .ToDictionary(e => e.Id);
        var venueDict  = venues .ToDictionary(v => v.Id);
        var screenDict = screens.ToDictionary(s => s.Id);
        var cityDict   = cities .ToDictionary(c => c.Id);

        var result = new List<AdminBookingDto>();
        foreach (var b in allBookings)
        {
            if (!b.ShowId.HasValue || !showDict.TryGetValue(b.ShowId.Value, out var show)) continue;
            if (!venueDict.TryGetValue(show.VenueId, out var venue)) continue;
            if (!cityDict.TryGetValue(venue.CityId, out var city)) continue;

            if (cityId.HasValue  && city.Id      != cityId.Value)  continue;
            if (movieId.HasValue && show.MovieId != movieId.Value) continue;
            if (venueId.HasValue && show.VenueId != venueId.Value) continue;

            var user   = userDict.TryGetValue(b.UserId, out var u) ? u : null;
            var movie  = show.MovieId.HasValue && movieDict.TryGetValue(show.MovieId.Value, out var m) ? m : null;
            var ev     = show.EventId.HasValue && eventDict.TryGetValue(show.EventId.Value, out var e) ? e : null;
            screenDict.TryGetValue(show.ScreenId, out var screen);

            result.Add(new AdminBookingDto(
                Id:                 b.Id,
                BookingRef:         b.BookingRef,
                Status:             b.Status.ToString(),
                AmountPaid:         b.AmountPaid,
                Discount:           b.Discount,
                TicketQty:          b.TicketQty,
                ConvenienceFee:     b.ConvenienceFee,
                Cgst:               b.Cgst,
                Sgst:               b.Sgst,
                Igst:               b.Igst,
                OfferProcessingFee: b.OfferProcessingFee,
                CreatedAt:          b.CreatedAt,
                CancelledAt:        b.CancelledAt,
                InvoiceUrl:         null,
                QrUrl:              null,
                InvoiceNumber:      null,
                UserId:             b.UserId,
                UserName:           user?.Name ?? string.Empty,
                UserEmail:          user?.Email ?? string.Empty,
                UserMobile:         user?.Mobile ?? string.Empty,
                MovieTitle:         movie?.Title,
                PosterUrl:          movie?.PosterUrl,
                EventTitle:         ev?.Title,
                ShowDate:           show.ShowDate,
                ShowDateLabel:      show.ShowDate.ToString("ddd, dd MMM yyyy"),
                ShowTimeLabel:      show.ShowTime.ToString("hh:mm tt"),
                Format:             show.Format,
                Language:           show.Language,
                VenueName:          venue.Name,
                ScreenName:         screen?.Name ?? string.Empty,
                CityName:           city.Name,
                PaymentMethod:      null,
                ProviderPaymentId:  null,
                PaymentStatus:      "None",
                RefundAmount:       null,
                RefundId:           null,
                SeatsSummary:       string.Empty));
        }

        return result;
    }
}
