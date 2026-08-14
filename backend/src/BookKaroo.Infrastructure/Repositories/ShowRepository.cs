using BookKaroo.Application.DTOs.Admin;
using BookKaroo.Application.DTOs.Shows;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Repositories;

public class ShowRepository : Repository<Show>, IShowRepository
{
    public ShowRepository(BookKarooDbContext db) : base(db) { }

    public async Task<IEnumerable<Show>> GetByMovieAndDateAsync(
        Guid movieId, DateOnly date, CancellationToken ct = default) =>
        await _db.Shows
            .Where(s => s.MovieId == movieId && s.ShowDate == date && s.Status == ShowStatus.Scheduled)
            .OrderBy(s => s.ShowTime)
            .ToListAsync(ct);

    public async Task<IEnumerable<Show>> GetByMovieAndDateAsync(
        Guid movieId, Guid cityId, DateOnly date, CancellationToken ct = default)
    {
        var venueIdsInCity = _db.Venues
            .Where(v => v.CityId == cityId)
            .Select(v => v.Id);

        return await _db.Shows
            .Where(s => s.MovieId == movieId
                     && s.ShowDate == date
                     && s.Status == ShowStatus.Scheduled
                     && venueIdsInCity.Contains(s.VenueId))
            .OrderBy(s => s.VenueId)
            .ThenBy(s => s.ShowTime)
            .ToListAsync(ct);
    }

    public async Task<SeatAvailability> GetSeatAvailabilityAsync(
        Guid showId, CancellationToken ct = default)
    {
        var booked = await (
            from bs in _db.BookingSeats
            join b in _db.Bookings.Where(b => b.ShowId == showId && b.Status == BookingStatus.Confirmed)
                on bs.BookingId equals b.Id
            select bs.SeatLabel
        ).ToArrayAsync(ct);

        var locked = await _db.SeatLocks
            .Where(sl => sl.ShowId == showId && sl.ExpiresAt > DateTime.UtcNow)
            .Select(sl => sl.SeatLabel)
            .ToArrayAsync(ct);

        return new SeatAvailability(booked, locked);
    }

    public async Task<Show?> GetByIdAsync(Guid showId, CancellationToken ct = default) =>
        await _db.Shows.FirstOrDefaultAsync(s => s.Id == showId, ct);

    public async Task<(List<ShowAdminDto> Items, int Total)> GetAllAdminAsync(
        Guid? movieId, Guid? venueId, Guid? screenId,
        DateOnly? fromDate, DateOnly? toDate, string? status,
        int page, int pageSize, CancellationToken ct = default)
    {
        var query = _db.Shows.AsQueryable();

        if (movieId.HasValue)  query = query.Where(s => s.MovieId == movieId);
        if (venueId.HasValue)  query = query.Where(s => s.VenueId == venueId);
        if (screenId.HasValue) query = query.Where(s => s.ScreenId == screenId);
        if (fromDate.HasValue) query = query.Where(s => s.ShowDate >= fromDate.Value);
        if (toDate.HasValue)   query = query.Where(s => s.ShowDate <= toDate.Value);

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<ShowStatus>(status, ignoreCase: true, out var statusEnum))
            query = query.Where(s => s.Status == statusEnum);

        var total = await query.CountAsync(ct);

        var shows = await query
            .OrderByDescending(s => s.ShowDatetime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var movieIds = shows.Where(s => s.MovieId.HasValue).Select(s => s.MovieId!.Value).Distinct().ToList();
        var eventIds = shows.Where(s => s.EventId.HasValue).Select(s => s.EventId!.Value).Distinct().ToList();
        var venueIds = shows.Select(s => s.VenueId).Distinct().ToList();
        var screenIds = shows.Select(s => s.ScreenId).Distinct().ToList();

        var movies  = await _db.Movies.Where(m => movieIds.Contains(m.Id)).ToDictionaryAsync(m => m.Id, ct);
        var events  = await _db.Events.Where(e => eventIds.Contains(e.Id)).ToDictionaryAsync(e => e.Id, ct);
        var venues  = await _db.Venues.Where(v => venueIds.Contains(v.Id)).ToDictionaryAsync(v => v.Id, ct);
        var screens = await _db.Screens.Where(s => screenIds.Contains(s.Id)).ToDictionaryAsync(s => s.Id, ct);

        var showIds = shows.Select(s => s.Id).ToList();

        var bookedSeats = await (
            from bs in _db.BookingSeats
            join b in _db.Bookings on bs.BookingId equals b.Id
            where b.ShowId.HasValue && showIds.Contains(b.ShowId!.Value) && b.Status == BookingStatus.Confirmed
            group bs by b.ShowId!.Value into g
            select new { ShowId = g.Key, Count = g.Count() }
        ).ToDictionaryAsync(x => x.ShowId, x => x.Count, ct);

        var revenue = await _db.Bookings
            .Where(b => b.ShowId.HasValue && showIds.Contains(b.ShowId!.Value) && b.Status == BookingStatus.Confirmed)
            .GroupBy(b => b.ShowId!.Value)
            .Select(g => new { ShowId = g.Key, Total = g.Sum(b => b.AmountPaid) })
            .ToDictionaryAsync(x => x.ShowId, x => x.Total, ct);

        var cityIds = venues.Values.Select(v => v.CityId).Distinct().ToList();
        var cities  = await _db.Cities.Where(c => cityIds.Contains(c.Id)).ToDictionaryAsync(c => c.Id, ct);

        var items = shows.Select(s =>
        {
            movies.TryGetValue(s.MovieId ?? Guid.Empty, out var movie);
            events.TryGetValue(s.EventId ?? Guid.Empty, out var ev);
            venues.TryGetValue(s.VenueId, out var venue);
            screens.TryGetValue(s.ScreenId, out var screen);
            cities.TryGetValue(venue?.CityId ?? Guid.Empty, out var city);
            bookedSeats.TryGetValue(s.Id, out var booked);
            revenue.TryGetValue(s.Id, out var rev);

            var total2 = screen?.TotalSeats ?? 0;
            var occupancy = total2 > 0 ? Math.Round((decimal)booked / total2 * 100, 1) : 0m;

            return new ShowAdminDto(
                s.Id,
                movie?.Title, movie?.PosterUrl,
                ev?.Title,
                s.VenueId, venue?.Name ?? "",
                screen?.Name ?? "",
                city?.Name ?? "",
                s.ShowDate,
                s.ShowDate.ToString("ddd, d MMM yyyy"),
                s.ShowTime.ToString("hh:mm tt"),
                s.ShowDatetime,
                s.Format, s.Language,
                s.Status.ToString(),
                total2, booked, total2 - booked,
                occupancy, rev);
        }).ToList();

        return (items, total);
    }

    public async Task<bool> HasConflictAsync(
        Guid screenId, DateTime showDatetime, Guid? excludeShowId, CancellationToken ct = default)
    {
        var query = _db.Shows.Where(s =>
            s.ScreenId == screenId &&
            s.ShowDatetime == showDatetime &&
            s.Status != ShowStatus.Cancelled);

        if (excludeShowId.HasValue)
            query = query.Where(s => s.Id != excludeShowId.Value);

        return await query.AnyAsync(ct);
    }

    public async Task<int> CancelAsync(Guid showId, CancellationToken ct = default)
    {
        var show = await _db.Shows.FirstOrDefaultAsync(s => s.Id == showId, ct);
        if (show != null)
        {
            show.Status = ShowStatus.Cancelled;
            show.UpdatedAt = DateTime.UtcNow;
        }

        var bookings = await _db.Bookings
            .Where(b => b.ShowId == showId &&
                        (b.Status == BookingStatus.Pending || b.Status == BookingStatus.Confirmed))
            .ToListAsync(ct);

        foreach (var b in bookings)
        {
            b.Status = BookingStatus.Cancelled;
            b.CancelledAt = DateTime.UtcNow;
            b.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
        return bookings.Count;
    }
}
