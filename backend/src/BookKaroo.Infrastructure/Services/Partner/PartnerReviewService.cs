using BookKaroo.Application.Common;
using BookKaroo.Application.DTOs.Partner;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Enums;
using BookKaroo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Infrastructure.Services.Partner;

public class PartnerReviewService : IPartnerReviewService
{
    private readonly BookKarooDbContext _db;
    public PartnerReviewService(BookKarooDbContext db) => _db = db;

    public async Task<PartnerReviewPage> GetReviewsAsync(
        IPartnerContext ctx, Guid? venueId, string? status, string sort,
        int page, int pageSize, CancellationToken ct)
    {
        var venueIds = ctx.VenueIds.ToList();
        if (venueId.HasValue)
        {
            ctx.EnsureVenueAccess(venueId.Value);
            venueIds = new List<Guid> { venueId.Value };
        }

        // Find movies/events that have shows in partner venues
        var movieIds = await _db.Shows
            .Where(s => venueIds.Contains(s.VenueId) && s.MovieId.HasValue)
            .Select(s => s.MovieId!.Value)
            .Distinct()
            .ToListAsync(ct);
        var eventIds = await _db.Shows
            .Where(s => venueIds.Contains(s.VenueId) && s.EventId.HasValue)
            .Select(s => s.EventId!.Value)
            .Distinct()
            .ToListAsync(ct);

        var query = _db.Reviews
            .Where(r => (r.MovieId.HasValue && movieIds.Contains(r.MovieId.Value))
                     || (r.EventId.HasValue && eventIds.Contains(r.EventId.Value)));

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<ReviewStatus>(status, true, out var st))
            query = query.Where(r => r.Status == st);

        query = sort?.ToLower() switch
        {
            "rating-desc" => query.OrderByDescending(r => r.Rating),
            "rating-asc"  => query.OrderBy(r => r.Rating),
            _             => query.OrderByDescending(r => r.CreatedAt),
        };

        var total = await query.CountAsync(ct);
        var reviews = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var items = new List<PartnerReviewResponse>();
        foreach (var r in reviews)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == r.UserId, ct);
            string movieTitle = "—";
            string? posterUrl = null;
            if (r.MovieId.HasValue)
            {
                var movie = await _db.Movies.FirstOrDefaultAsync(m => m.Id == r.MovieId.Value, ct);
                if (movie != null) { movieTitle = movie.Title; posterUrl = movie.PosterUrl; }
            }
            else if (r.EventId.HasValue)
            {
                var ev = await _db.Events.FirstOrDefaultAsync(e => e.Id == r.EventId.Value, ct);
                if (ev != null) { movieTitle = ev.Title; posterUrl = ev.PosterUrl; }
            }

            string venueName = "Multiple";
            if (venueIds.Count == 1)
            {
                var v = await _db.Venues.FirstOrDefaultAsync(x => x.Id == venueIds[0], ct);
                venueName = v?.Name ?? "—";
            }

            items.Add(new PartnerReviewResponse(
                r.Id, r.Rating, r.Title, r.Body,
                user?.Name ?? "Anonymous", r.IsVerifiedBooking,
                movieTitle, posterUrl, r.ThumbsUp, r.ThumbsDown,
                r.Status.ToString(), r.CreatedAt, venueName));
        }
        return new PartnerReviewPage(items, total, page, pageSize);
    }

    public async Task HideReviewAsync(IPartnerContext ctx, Guid reviewId, CancellationToken ct)
    {
        var review = await _db.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId, ct)
            ?? throw new NotFoundException("Review not found");
        EnsureReviewBelongsToPartner(ctx, review);
        review.Status = ReviewStatus.Hidden;
        await _db.SaveChangesAsync(ct);
    }

    public async Task ShowReviewAsync(IPartnerContext ctx, Guid reviewId, CancellationToken ct)
    {
        var review = await _db.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId, ct)
            ?? throw new NotFoundException("Review not found");
        EnsureReviewBelongsToPartner(ctx, review);
        review.Status = ReviewStatus.Published;
        await _db.SaveChangesAsync(ct);
    }

    private void EnsureReviewBelongsToPartner(IPartnerContext ctx, Domain.Entities.Review review)
    {
        if (ctx.PartnerId == Guid.Empty) return; // admin bypass

        var venueIds = ctx.VenueIds.ToList();
        bool ok = false;
        if (review.MovieId.HasValue)
            ok = _db.Shows.Any(s => s.MovieId == review.MovieId && venueIds.Contains(s.VenueId));
        else if (review.EventId.HasValue)
            ok = _db.Shows.Any(s => s.EventId == review.EventId && venueIds.Contains(s.VenueId));

        if (!ok)
            throw new ForbiddenException("This review is not for content shown at your venues");
    }
}
