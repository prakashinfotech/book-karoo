using BookKaroo.Application.Common;
using BookKaroo.Application.DTOs.Partner;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Services.Partner;

public class PartnerDashboardService : IPartnerDashboardService
{
    private readonly BookKaroo.Infrastructure.Data.BookKarooDbContext _db;

    public PartnerDashboardService(BookKaroo.Infrastructure.Data.BookKarooDbContext db) => _db = db;

    public async Task<PartnerDashboardResponse> GetDashboardAsync(IPartnerContext ctx, CancellationToken ct)
    {
        var venueIds = ctx.VenueIds.ToList();
        var now      = DateTime.UtcNow;
        var today    = now.Date;
        var weekAgo  = today.AddDays(-7);
        var monthAgo = today.AddDays(-30);

        var venues = await _db.Venues
            .Where(v => venueIds.Contains(v.Id))
            .ToListAsync(ct);
        var venueNames = venues.Select(v => v.Name).ToList();

        var partner = await _db.PartnerProfiles
            .FirstOrDefaultAsync(p => p.Id == ctx.PartnerId, ct);
        var partnerName = partner?.BusinessName ?? "Partner";

        // Shows for partner venues
        var partnerShowIds = await _db.Shows
            .Where(s => venueIds.Contains(s.VenueId))
            .Select(s => s.Id)
            .ToListAsync(ct);

        var bookingsQuery = _db.Bookings
            .Where(b => b.ShowId.HasValue && partnerShowIds.Contains(b.ShowId!.Value));

        var confirmedQuery = bookingsQuery.Where(b => b.Status == BookingStatus.Confirmed);

        var todayBookings = await confirmedQuery.Where(b => b.CreatedAt >= today && b.CreatedAt < today.AddDays(1)).CountAsync(ct);
        var todayRevenue  = await confirmedQuery.Where(b => b.CreatedAt >= today && b.CreatedAt < today.AddDays(1)).SumAsync(b => (decimal?)b.AmountPaid, ct) ?? 0m;
        var weekRevenue   = await confirmedQuery.Where(b => b.CreatedAt >= weekAgo).SumAsync(b => (decimal?)b.AmountPaid, ct) ?? 0m;
        var monthRevenue  = await confirmedQuery.Where(b => b.CreatedAt >= monthAgo).SumAsync(b => (decimal?)b.AmountPaid, ct) ?? 0m;
        var totalAll      = await confirmedQuery.CountAsync(ct);

        var upcomingShows = await _db.Shows
            .Where(s => venueIds.Contains(s.VenueId)
                     && s.Status == ShowStatus.Scheduled
                     && s.ShowDatetime > now
                     && s.ShowDatetime <= now.AddDays(7))
            .CountAsync(ct);

        var bookingsPerDay = new List<DailyBookingStat>();
        for (int i = 6; i >= 0; i--)
        {
            var d = today.AddDays(-i);
            var dEnd = d.AddDays(1);
            var count = await confirmedQuery
                .Where(b => b.CreatedAt >= d && b.CreatedAt < dEnd)
                .CountAsync(ct);
            bookingsPerDay.Add(new DailyBookingStat(d.ToString("MMM dd"), count));
        }

        var revenuePerVenue = new List<VenueRevenueStat>();
        foreach (var venue in venues)
        {
            var venueShowIds = await _db.Shows
                .Where(s => s.VenueId == venue.Id)
                .Select(s => s.Id)
                .ToListAsync(ct);
            var rev = await _db.Bookings
                .Where(b => b.Status == BookingStatus.Confirmed
                         && b.ShowId.HasValue
                         && venueShowIds.Contains(b.ShowId!.Value))
                .SumAsync(b => (decimal?)b.AmountPaid, ct) ?? 0m;
            revenuePerVenue.Add(new VenueRevenueStat(venue.Name, rev));
        }

        var recent = await bookingsQuery
            .OrderByDescending(b => b.CreatedAt)
            .Take(10)
            .ToListAsync(ct);

        var recentDtos = new List<RecentPartnerBooking>();
        foreach (var b in recent)
        {
            var show  = await _db.Shows.FirstOrDefaultAsync(s => s.Id == b.ShowId, ct);
            var venue = show != null ? venues.FirstOrDefault(v => v.Id == show.VenueId) : null;
            string title = "Unknown";
            if (show != null)
            {
                if (show.MovieId.HasValue)
                    title = (await _db.Movies.FirstOrDefaultAsync(m => m.Id == show.MovieId.Value, ct))?.Title ?? "Movie";
                else if (show.EventId.HasValue)
                    title = (await _db.Events.FirstOrDefaultAsync(e => e.Id == show.EventId.Value, ct))?.Title ?? "Event";
            }
            recentDtos.Add(new RecentPartnerBooking(
                b.BookingRef, title, venue?.Name ?? "—", b.AmountPaid,
                b.Status.ToString(), b.CreatedAt));
        }

        // Placeholder occupancy — full calculation requires per-show seat counts
        decimal occupancy = 0m;
        var weekShowCount = await _db.Shows
            .Where(s => venueIds.Contains(s.VenueId) && s.ShowDatetime >= weekAgo && s.ShowDatetime <= now)
            .CountAsync(ct);
        if (weekShowCount > 0)
        {
            var weekSeatsBooked = await _db.BookingSeats
                .Where(bs => _db.Bookings.Any(b => b.Id == bs.BookingId
                    && b.Status == BookingStatus.Confirmed
                    && b.CreatedAt >= weekAgo
                    && b.ShowId.HasValue
                    && partnerShowIds.Contains(b.ShowId!.Value)))
                .CountAsync(ct);
            var weekTotalSeats = await _db.Screens
                .Where(sc => venueIds.Contains(sc.VenueId))
                .SumAsync(sc => (int?)sc.TotalSeats, ct) ?? 0;
            if (weekTotalSeats > 0)
                occupancy = Math.Round((decimal)weekSeatsBooked * 100m / (weekTotalSeats * Math.Max(1, weekShowCount / Math.Max(1, venues.Count))), 1);
        }

        return new PartnerDashboardResponse(
            partnerName, venueNames,
            todayBookings, todayRevenue, weekRevenue, monthRevenue,
            totalAll, upcomingShows,
            bookingsPerDay, revenuePerVenue, recentDtos, occupancy);
    }

    public async Task<PartnerReportResponse> GetReportAsync(
        IPartnerContext ctx, DateOnly? fromDate, DateOnly? toDate, CancellationToken ct)
    {
        var venueIds = ctx.VenueIds.ToList();
        var today    = DateTime.UtcNow.Date;

        var from = fromDate.HasValue
            ? fromDate.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc)
            : today.AddDays(-30);
        var to = toDate.HasValue
            ? toDate.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc)
            : today.AddDays(1);

        var venues = await _db.Venues.Where(v => venueIds.Contains(v.Id)).ToListAsync(ct);

        var partnerShowIds = await _db.Shows
            .Where(s => venueIds.Contains(s.VenueId))
            .Select(s => s.Id)
            .ToListAsync(ct);

        var rangeQuery = _db.Bookings
            .Where(b => b.Status == BookKaroo.Domain.Enums.BookingStatus.Confirmed
                     && b.ShowId.HasValue
                     && partnerShowIds.Contains(b.ShowId!.Value)
                     && b.CreatedAt >= from
                     && b.CreatedAt <= to);

        var totalBookings = await rangeQuery.CountAsync(ct);
        var totalRevenue  = await rangeQuery.SumAsync(b => (decimal?)b.AmountPaid, ct) ?? 0m;

        // Daily bookings — one entry per day in range (capped at 90 days)
        var days = (int)Math.Min(90, (to - from).TotalDays + 1);
        var bookingsPerDay = new List<DailyBookingStat>();
        for (int i = 0; i < days; i++)
        {
            var d    = from.Date.AddDays(i);
            var dEnd = d.AddDays(1);
            var cnt  = await rangeQuery.Where(b => b.CreatedAt >= d && b.CreatedAt < dEnd).CountAsync(ct);
            bookingsPerDay.Add(new DailyBookingStat(d.ToString("MMM dd"), cnt));
        }

        var revenuePerVenue = new List<VenueRevenueStat>();
        foreach (var venue in venues)
        {
            var venueShowIds = await _db.Shows.Where(s => s.VenueId == venue.Id).Select(s => s.Id).ToListAsync(ct);
            var rev = await _db.Bookings
                .Where(b => b.Status == BookKaroo.Domain.Enums.BookingStatus.Confirmed
                         && b.ShowId.HasValue
                         && venueShowIds.Contains(b.ShowId!.Value)
                         && b.CreatedAt >= from && b.CreatedAt <= to)
                .SumAsync(b => (decimal?)b.AmountPaid, ct) ?? 0m;
            revenuePerVenue.Add(new VenueRevenueStat(venue.Name, rev));
        }

        var recent = await rangeQuery.OrderByDescending(b => b.CreatedAt).Take(20).ToListAsync(ct);
        var recentDtos = new List<RecentPartnerBooking>();
        foreach (var b in recent)
        {
            var show  = await _db.Shows.FirstOrDefaultAsync(s => s.Id == b.ShowId, ct);
            var venue = show != null ? venues.FirstOrDefault(v => v.Id == show.VenueId) : null;
            string title = "Unknown";
            if (show != null)
            {
                if (show.MovieId.HasValue)
                    title = (await _db.Movies.FirstOrDefaultAsync(m => m.Id == show.MovieId.Value, ct))?.Title ?? "Movie";
                else if (show.EventId.HasValue)
                    title = (await _db.Events.FirstOrDefaultAsync(e => e.Id == show.EventId.Value, ct))?.Title ?? "Event";
            }
            recentDtos.Add(new RecentPartnerBooking(b.BookingRef, title, venue?.Name ?? "—", b.AmountPaid, b.Status.ToString(), b.CreatedAt));
        }

        return new PartnerReportResponse(totalBookings, totalRevenue, bookingsPerDay, revenuePerVenue, recentDtos);
    }
}
