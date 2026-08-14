using BookKaroo.Application.Common;
using BookKaroo.Application.DTOs.Partner;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Enums;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Services.Partner;

public class PartnerBookingService : IPartnerBookingService
{
    private readonly BookKarooDbContext _db;
    public PartnerBookingService(BookKarooDbContext db) => _db = db;

    public async Task<PartnerBookingPage> GetBookingsAsync(
        IPartnerContext ctx, string? search, string? status, Guid? venueId,
        DateOnly? fromDate, DateOnly? toDate, int page, int pageSize, CancellationToken ct)
    {
        var venueIds = ctx.VenueIds.ToList();
        if (venueId.HasValue)
        {
            ctx.EnsureVenueAccess(venueId.Value);
            venueIds = new List<Guid> { venueId.Value };
        }

        var partnerShowIds = await _db.Shows
            .Where(s => venueIds.Contains(s.VenueId))
            .Select(s => s.Id)
            .ToListAsync(ct);

        var query = _db.Bookings
            .Where(b => b.ShowId.HasValue && partnerShowIds.Contains(b.ShowId!.Value));

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<BookingStatus>(status, true, out var st))
            query = query.Where(b => b.Status == st);
        if (fromDate.HasValue)
        {
            var from = fromDate.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(b => b.CreatedAt >= from);
        }
        if (toDate.HasValue)
        {
            var to = toDate.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            query = query.Where(b => b.CreatedAt <= to);
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search.Trim().ToLower()}%";

            var matchingUserIds = await _db.Users
                .Where(u => EF.Functions.Like(u.Name.ToLower(), pattern))
                .Select(u => u.Id).ToListAsync(ct);

            var matchingMovieIds = await _db.Movies
                .Where(m => EF.Functions.Like(m.Title.ToLower(), pattern))
                .Select(m => m.Id).ToListAsync(ct);

            var matchingEventIds = await _db.Events
                .Where(e => EF.Functions.Like(e.Title.ToLower(), pattern))
                .Select(e => e.Id).ToListAsync(ct);

            var matchingShowIds = await _db.Shows
                .Where(s => venueIds.Contains(s.VenueId) && (
                    (s.MovieId.HasValue && matchingMovieIds.Contains(s.MovieId.Value)) ||
                    (s.EventId.HasValue && matchingEventIds.Contains(s.EventId.Value))))
                .Select(s => s.Id).ToListAsync(ct);

            query = query.Where(b =>
                EF.Functions.Like(b.BookingRef.ToLower(), pattern) ||
                matchingUserIds.Contains(b.UserId) ||
                (b.ShowId.HasValue && matchingShowIds.Contains(b.ShowId.Value)));
        }

        var total          = await query.CountAsync(ct);
        var confirmedCount = await query.CountAsync(b => b.Status == BookingStatus.Confirmed, ct);
        var cancelledCount = await query.CountAsync(b => b.Status == BookingStatus.Cancelled, ct);
        var totalRevenue   = total > 0
            ? await query.Where(b => b.Status == BookingStatus.Confirmed).SumAsync(b => b.AmountPaid, ct)
            : 0m;

        var bookings = await query
            .OrderByDescending(b => b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = new List<PartnerBookingListItem>();
        foreach (var b in bookings)
        {
            var show   = await _db.Shows.FirstOrDefaultAsync(s => s.Id == b.ShowId, ct);
            var venue  = show != null ? await _db.Venues.FirstOrDefaultAsync(v => v.Id == show.VenueId, ct) : null;
            var screen = show != null ? await _db.Screens.FirstOrDefaultAsync(sc => sc.Id == show.ScreenId, ct) : null;
            var user   = await _db.Users.FirstOrDefaultAsync(u => u.Id == b.UserId, ct);
            string title = "Unknown";
            if (show != null)
            {
                if (show.MovieId.HasValue)
                    title = (await _db.Movies.FirstOrDefaultAsync(m => m.Id == show.MovieId.Value, ct))?.Title ?? "Movie";
                else if (show.EventId.HasValue)
                    title = (await _db.Events.FirstOrDefaultAsync(e => e.Id == show.EventId.Value, ct))?.Title ?? "Event";
            }
            items.Add(new PartnerBookingListItem(
                b.BookingRef, b.UserId, user?.Name ?? "—",
                title, venue?.Name ?? "—", screen?.Name ?? "—",
                show?.ShowDatetime ?? b.CreatedAt, b.TicketQty, b.AmountPaid,
                b.Status.ToString(), b.CreatedAt));
        }
        var totalPages = (int)Math.Ceiling((double)total / pageSize);
        return new PartnerBookingPage(items, total, page, pageSize, totalPages,
            confirmedCount, cancelledCount, totalRevenue);
    }

    public async Task<PartnerBookingDetail> GetBookingDetailAsync(IPartnerContext ctx, string bookingRef, CancellationToken ct)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.BookingRef == bookingRef, ct)
            ?? throw new NotFoundException("Booking not found");
        var show = booking.ShowId.HasValue
            ? await _db.Shows.FirstOrDefaultAsync(s => s.Id == booking.ShowId, ct)
            : null;
        if (show == null) throw new NotFoundException("Show not found for booking");
        ctx.EnsureVenueAccess(show.VenueId);

        var venue  = await _db.Venues.FirstOrDefaultAsync(v => v.Id == show.VenueId, ct);
        var screen = await _db.Screens.FirstOrDefaultAsync(sc => sc.Id == show.ScreenId, ct);
        var user   = await _db.Users.FirstOrDefaultAsync(u => u.Id == booking.UserId, ct);
        var seats  = await _db.BookingSeats.Where(bs => bs.BookingId == booking.Id).Select(bs => bs.SeatLabel).ToListAsync(ct);

        string title = "Unknown";
        if (show.MovieId.HasValue)
            title = (await _db.Movies.FirstOrDefaultAsync(m => m.Id == show.MovieId.Value, ct))?.Title ?? "Movie";
        else if (show.EventId.HasValue)
            title = (await _db.Events.FirstOrDefaultAsync(e => e.Id == show.EventId.Value, ct))?.Title ?? "Event";

        return new PartnerBookingDetail(
            booking.BookingRef, booking.UserId, user?.Name ?? "—", user?.Email ?? "—",
            title, venue?.Name ?? "—", screen?.Name ?? "—",
            show.ShowDatetime, booking.TicketQty, seats,
            booking.TicketAmount, booking.ConvenienceFee, booking.Discount, booking.AmountPaid,
            booking.Status.ToString(), booking.CreatedAt, booking.CancelledAt);
    }

    public async Task<PartnerBookingDetail> CancelBookingAsync(IPartnerContext ctx, string bookingRef, CancellationToken ct)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.BookingRef == bookingRef, ct)
            ?? throw new NotFoundException("Booking not found");
        var show = booking.ShowId.HasValue
            ? await _db.Shows.FirstOrDefaultAsync(s => s.Id == booking.ShowId, ct)
            : null;
        if (show == null) throw new NotFoundException("Show not found for booking");
        ctx.EnsureVenueAccess(show.VenueId);

        if (booking.Status == BookingStatus.Cancelled)
            throw new ConflictException("Booking already cancelled");

        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return await GetBookingDetailAsync(ctx, bookingRef, ct);
    }
}
