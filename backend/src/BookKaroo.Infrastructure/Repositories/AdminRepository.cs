using BookKaroo.Application.DTOs.Admin;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Domain.Enums;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Repositories;

public class AdminRepository : IAdminRepository
{
    private readonly BookKarooDbContext _db;

    public AdminRepository(BookKarooDbContext db) => _db = db;

    public async Task<int> CountTodayBookingsAsync(DateTime todayStart, DateTime todayEnd, CancellationToken ct = default) =>
        await _db.Bookings
            .Where(b => b.Status == BookingStatus.Confirmed
                     && b.CreatedAt >= todayStart && b.CreatedAt < todayEnd
                     && b.DeletedAt == null)
            .CountAsync(ct);

    public async Task<decimal> SumTodayRevenueAsync(DateTime todayStart, DateTime todayEnd, CancellationToken ct = default) =>
        await _db.Bookings
            .Where(b => b.Status == BookingStatus.Confirmed
                     && b.CreatedAt >= todayStart && b.CreatedAt < todayEnd
                     && b.DeletedAt == null)
            .SumAsync(b => (decimal?)b.AmountPaid, ct) ?? 0m;

    public async Task<decimal> SumWeekRevenueAsync(DateTime weekStart, CancellationToken ct = default) =>
        await _db.Bookings
            .Where(b => b.Status == BookingStatus.Confirmed
                     && b.CreatedAt >= weekStart
                     && b.DeletedAt == null)
            .SumAsync(b => (decimal?)b.AmountPaid, ct) ?? 0m;

    public async Task<decimal> SumMonthRevenueAsync(DateTime monthStart, CancellationToken ct = default) =>
        await _db.Bookings
            .Where(b => b.Status == BookingStatus.Confirmed
                     && b.CreatedAt >= monthStart
                     && b.DeletedAt == null)
            .SumAsync(b => (decimal?)b.AmountPaid, ct) ?? 0m;

    public async Task<int> CountTotalUsersAsync(CancellationToken ct = default) =>
        await _db.Users
            .Where(u => u.DeletedAt == null && u.Role == UserRole.User)
            .CountAsync(ct);

    public async Task<int> CountNewUsersTodayAsync(DateTime todayStart, DateTime todayEnd, CancellationToken ct = default) =>
        await _db.Users
            .Where(u => u.DeletedAt == null
                     && u.CreatedAt >= todayStart && u.CreatedAt < todayEnd)
            .CountAsync(ct);

    public async Task<TopMovieDto?> GetTopMovieThisWeekAsync(DateTime weekStart, CancellationToken ct = default)
    {
        var weekShowIds = await _db.Bookings
            .Where(b => b.Status == BookingStatus.Confirmed
                     && b.CreatedAt >= weekStart
                     && b.DeletedAt == null)
            .Select(b => b.ShowId)
            .ToListAsync(ct);

        if (weekShowIds.Count == 0) return null;

        var top = await _db.Shows
            .Where(s => weekShowIds.Contains(s.Id) && s.MovieId != null)
            .GroupBy(s => s.MovieId!)
            .Select(g => new { MovieId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .FirstOrDefaultAsync(ct);

        if (top is null) return null;

        var movie = await _db.Movies.FirstOrDefaultAsync(m => m.Id == top.MovieId, ct);
        return movie is null ? null
            : new TopMovieDto(movie.Id, movie.Title, movie.Slug, movie.PosterUrl, top.Count);
    }

    public async Task<IReadOnlyList<DayCount>> GetBookingsPerDayAsync(DateTime fromDate, CancellationToken ct = default)
    {
        var bookingDates = await _db.Bookings
            .Where(b => b.Status == BookingStatus.Confirmed
                     && b.CreatedAt >= fromDate
                     && b.DeletedAt == null)
            .Select(b => b.CreatedAt)
            .ToListAsync(ct);

        var today = DateTime.UtcNow.Date;
        return Enumerable.Range(0, 7)
            .Select(i => today.AddDays(-6 + i))
            .Select(d => new DayCount(
                d.ToString("ddd"),
                bookingDates.Count(dt => dt >= d && dt < d.AddDays(1))))
            .ToList();
    }

    public async Task<IReadOnlyList<CityRevenue>> GetRevenuePerCityAsync(int top, CancellationToken ct = default)
    {
        var confirmedBookings = await _db.Bookings
            .Where(b => b.Status == BookingStatus.Confirmed && b.DeletedAt == null && b.ShowId.HasValue)
            .Select(b => new { ShowId = b.ShowId!.Value, b.AmountPaid })
            .ToListAsync(ct);

        if (confirmedBookings.Count == 0) return Array.Empty<CityRevenue>();

        var showIds = confirmedBookings.Select(b => b.ShowId).Distinct().ToList();
        var showVenueMap = await _db.Shows
            .Where(s => showIds.Contains(s.Id))
            .Select(s => new { s.Id, s.VenueId })
            .ToDictionaryAsync(s => s.Id, s => s.VenueId, ct);

        var venueIds = showVenueMap.Values.Distinct().ToList();
        var venueCityMap = await _db.Venues
            .Where(v => venueIds.Contains(v.Id))
            .Select(v => new { v.Id, v.CityId })
            .ToDictionaryAsync(v => v.Id, v => v.CityId, ct);

        var cityIds = venueCityMap.Values.Distinct().ToList();
        var cityNames = await _db.Cities
            .Where(c => cityIds.Contains(c.Id))
            .Select(c => new { c.Id, c.Name })
            .ToDictionaryAsync(c => c.Id, c => c.Name, ct);

        return confirmedBookings
            .Where(b => showVenueMap.TryGetValue(b.ShowId, out var vid)
                     && venueCityMap.TryGetValue(vid, out var cid)
                     && cityNames.ContainsKey(cid))
            .GroupBy(b =>
            {
                showVenueMap.TryGetValue(b.ShowId, out var vid);
                venueCityMap.TryGetValue(vid, out var cid);
                return cityNames[cid];
            })
            .Select(g => new CityRevenue(g.Key, g.Sum(b => b.AmountPaid)))
            .OrderByDescending(c => c.Revenue)
            .Take(top)
            .ToList();
    }

    public async Task<IReadOnlyList<RecentBookingDto>> GetRecentBookingsAsync(int count, CancellationToken ct = default)
    {
        var bookings = await _db.Bookings
            .Where(b => b.DeletedAt == null)
            .OrderByDescending(b => b.CreatedAt)
            .Take(count)
            .ToListAsync(ct);

        var result = new List<RecentBookingDto>();
        foreach (var b in bookings)
        {
            var user  = await _db.Users.FirstOrDefaultAsync(u => u.Id == b.UserId, ct);
            var show  = await _db.Shows.FirstOrDefaultAsync(s => s.Id == b.ShowId, ct);
            var venue = show is not null ? await _db.Venues.FirstOrDefaultAsync(v => v.Id == show.VenueId, ct) : null;
            var movie = show?.MovieId is not null
                ? await _db.Movies.FirstOrDefaultAsync(m => m.Id == show.MovieId, ct)
                : null;

            result.Add(new RecentBookingDto(
                b.BookingRef,
                b.Status.ToString(),
                b.AmountPaid,
                b.CreatedAt,
                user?.Name ?? "Unknown",
                user?.Email ?? string.Empty,
                movie?.Title,
                movie?.PosterUrl,
                show?.ShowDate.ToString("d MMM yyyy"),
                show?.ShowTime.ToString(@"hh\:mm tt"),
                venue?.Name ?? "Unknown"));
        }

        return result;
    }

    public async Task<IReadOnlyList<ActivityDto>> GetRecentActivityAsync(int count, CancellationToken ct = default) =>
        await _db.AuditLogs
            .OrderByDescending(a => a.CreatedAt)
            .Take(count)
            .Select(a => new ActivityDto(a.Action, a.EntityType, a.EntityId, a.CreatedAt, a.Ip))
            .ToListAsync(ct);

    public async Task<(IReadOnlyList<AuditLogResponse> Items, int Total)> GetAuditLogsAsync(
        string? entityType, int page, int pageSize, CancellationToken ct = default)
    {
        var query = _db.AuditLogs.AsQueryable();
        if (!string.IsNullOrWhiteSpace(entityType))
            query = query.Where(a => a.EntityType == entityType);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogResponse(
                a.Id, a.UserId, a.Action, a.EntityType, a.EntityId,
                a.Before, a.After, a.Ip, a.CreatedAt))
            .ToListAsync(ct);

        return (items, total);
    }
}
