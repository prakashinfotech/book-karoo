using BookKaroo.Application.Common;
using BookKaroo.Application.DTOs.Partner;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Services.Partner;

public class PartnerShowService : IPartnerShowService
{
    private readonly BookKarooDbContext _db;
    public PartnerShowService(BookKarooDbContext db) => _db = db;

    public async Task<(List<PartnerShowResponse> Items, int Total)> GetShowsAsync(
        IPartnerContext ctx, Guid? venueId, Guid? screenId,
        DateOnly? fromDate, DateOnly? toDate, string? status, string? search,
        int page, int pageSize, CancellationToken ct)
    {
        var venueIds = ctx.VenueIds.ToList();
        if (venueId.HasValue)
        {
            ctx.EnsureVenueAccess(venueId.Value);
            venueIds = new List<Guid> { venueId.Value };
        }

        var query = _db.Shows.Where(s => venueIds.Contains(s.VenueId));
        if (screenId.HasValue) query = query.Where(s => s.ScreenId == screenId.Value);
        if (fromDate.HasValue) query = query.Where(s => s.ShowDate >= fromDate.Value);
        if (toDate.HasValue)   query = query.Where(s => s.ShowDate <= toDate.Value);
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ShowStatus>(status, true, out var st))
            query = query.Where(s => s.Status == st);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search.Trim().ToLower()}%";
            var matchingMovieIds = await _db.Movies
                .Where(m => EF.Functions.Like(m.Title.ToLower(), pattern))
                .Select(m => m.Id).ToListAsync(ct);
            var matchingEventIds = await _db.Events
                .Where(e => EF.Functions.Like(e.Title.ToLower(), pattern))
                .Select(e => e.Id).ToListAsync(ct);
            var matchingVenueIds = await _db.Venues
                .Where(v => venueIds.Contains(v.Id) && EF.Functions.Like(v.Name.ToLower(), pattern))
                .Select(v => v.Id).ToListAsync(ct);
            var matchingScreenIds = await _db.Screens
                .Where(sc => EF.Functions.Like(sc.Name.ToLower(), pattern))
                .Select(sc => sc.Id).ToListAsync(ct);

            query = query.Where(s =>
                (s.MovieId.HasValue  && matchingMovieIds.Contains(s.MovieId.Value)) ||
                (s.EventId.HasValue  && matchingEventIds.Contains(s.EventId.Value)) ||
                matchingVenueIds.Contains(s.VenueId) ||
                matchingScreenIds.Contains(s.ScreenId));
        }

        var total = await query.CountAsync(ct);
        var shows = await query
            .OrderByDescending(s => s.ShowDatetime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = new List<PartnerShowResponse>();
        foreach (var s in shows)
        {
            var venue  = await _db.Venues.FirstOrDefaultAsync(v => v.Id == s.VenueId, ct);
            var screen = await _db.Screens.FirstOrDefaultAsync(sc => sc.Id == s.ScreenId, ct);
            string? movieTitle = s.MovieId.HasValue
                ? (await _db.Movies.FirstOrDefaultAsync(m => m.Id == s.MovieId.Value, ct))?.Title
                : null;
            string? eventTitle = s.EventId.HasValue
                ? (await _db.Events.FirstOrDefaultAsync(e => e.Id == s.EventId.Value, ct))?.Title
                : null;
            var bookedSeats = await (
                from bs in _db.BookingSeats
                join b in _db.Bookings on bs.BookingId equals b.Id
                where b.ShowId.HasValue && b.ShowId.Value == s.Id && b.Status == BookingStatus.Confirmed
                select bs
            ).CountAsync(ct);
            items.Add(new PartnerShowResponse(
                s.Id, s.VenueId, venue?.Name ?? "—", s.ScreenId, screen?.Name ?? "—",
                s.MovieId, movieTitle, s.EventId, eventTitle,
                s.ShowDate, s.ShowTime, s.Format, s.Language, s.Status.ToString(), bookedSeats));
        }
        return (items, total);
    }

    public async Task<PartnerShowResponse> CreateShowAsync(
        IPartnerContext ctx, CreatePartnerShowRequest req, CancellationToken ct)
    {
        ctx.EnsureVenueAccess(req.VenueId);
        var screen = await _db.Screens.FirstOrDefaultAsync(s => s.Id == req.ScreenId, ct)
            ?? throw new NotFoundException("Screen not found");
        if (screen.VenueId != req.VenueId)
            throw new ValidationException(new() { ["screenId"] = new[] { "Screen does not belong to venue" } });

        if (!req.MovieId.HasValue && !req.EventId.HasValue)
            throw new ValidationException(new() { ["movieId"] = new[] { "Either MovieId or EventId required" } });

        var datetime = req.ShowDate.ToDateTime(req.ShowTime, DateTimeKind.Utc);

        var show = new Show
        {
            ScreenId       = req.ScreenId,
            VenueId        = req.VenueId,
            MovieId        = req.MovieId,
            EventId        = req.EventId,
            ShowDate       = req.ShowDate,
            ShowTime       = req.ShowTime,
            ShowDatetime   = datetime,
            Format         = req.Format,
            Language       = req.Language,
            PriceOverrides = req.PriceOverrides,
            Status         = ShowStatus.Scheduled
        };
        await _db.Shows.AddAsync(show, ct);
        await _db.SaveChangesAsync(ct);

        var venue = await _db.Venues.FirstOrDefaultAsync(v => v.Id == show.VenueId, ct);
        string? movieTitle = show.MovieId.HasValue
            ? (await _db.Movies.FirstOrDefaultAsync(m => m.Id == show.MovieId.Value, ct))?.Title : null;
        string? eventTitle = show.EventId.HasValue
            ? (await _db.Events.FirstOrDefaultAsync(e => e.Id == show.EventId.Value, ct))?.Title : null;

        return new PartnerShowResponse(
            show.Id, show.VenueId, venue?.Name ?? "—", show.ScreenId, screen.Name,
            show.MovieId, movieTitle, show.EventId, eventTitle,
            show.ShowDate, show.ShowTime, show.Format, show.Language, show.Status.ToString(), 0);
    }

    public async Task CancelShowAsync(IPartnerContext ctx, Guid showId, CancellationToken ct)
    {
        var show = await _db.Shows.FirstOrDefaultAsync(s => s.Id == showId, ct)
            ?? throw new NotFoundException("Show not found");
        ctx.EnsureVenueAccess(show.VenueId);
        show.Status = ShowStatus.Cancelled;
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteShowAsync(IPartnerContext ctx, Guid showId, CancellationToken ct)
    {
        var show = await _db.Shows.FirstOrDefaultAsync(s => s.Id == showId, ct)
            ?? throw new NotFoundException("Show not found");
        ctx.EnsureVenueAccess(show.VenueId);

        var hasBookings = await _db.Bookings.AnyAsync(
            b => b.ShowId == showId && b.Status == BookingStatus.Confirmed, ct);
        if (hasBookings)
            throw new ConflictException("Cannot delete a show with confirmed bookings");

        show.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
