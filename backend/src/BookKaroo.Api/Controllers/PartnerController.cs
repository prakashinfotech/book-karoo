using BookKaroo.Application.Common;
using BookKaroo.Application.DTOs.Partner;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("api/partner")]
[Authorize(Roles = "Partner,Admin")]
public class PartnerController : ControllerBase
{
    private readonly IPartnerContext          _ctx;
    private readonly IPartnerDashboardService _dashboard;
    private readonly IPartnerShowService      _shows;
    private readonly IPartnerBookingService   _bookings;
    private readonly IPartnerVenueService     _venues;
    private readonly IPartnerReviewService    _reviews;

    public PartnerController(
        IPartnerContext ctx,
        IPartnerDashboardService dashboard,
        IPartnerShowService shows,
        IPartnerBookingService bookings,
        IPartnerVenueService venues,
        IPartnerReviewService reviews)
    {
        _ctx = ctx; _dashboard = dashboard; _shows = shows;
        _bookings = bookings; _venues = venues; _reviews = reviews;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken ct) =>
        Ok(await _dashboard.GetDashboardAsync(_ctx, ct));

    [HttpGet("reports")]
    public async Task<IActionResult> GetReport(
        [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate,
        CancellationToken ct) =>
        Ok(await _dashboard.GetReportAsync(_ctx, fromDate, toDate, ct));

    // ── Venues ──────────────────────────────────────────────────────────
    [HttpGet("venues")]
    public async Task<IActionResult> GetVenues(CancellationToken ct) =>
        Ok(await _venues.GetMyVenuesAsync(_ctx, ct));

    [HttpGet("venues/{venueId:guid}")]
    public async Task<IActionResult> GetVenue(Guid venueId, CancellationToken ct) =>
        Ok(await _venues.GetVenueWithScreensAsync(_ctx, venueId, ct));

    [HttpPatch("venues/{venueId:guid}")]
    public async Task<IActionResult> UpdateVenue(Guid venueId, [FromBody] UpdateVenueOperationalRequest req, CancellationToken ct) =>
        Ok(await _venues.UpdateVenueOperationalDetailsAsync(_ctx, venueId, req, ct));

    [HttpPost("venues/{venueId:guid}/screens")]
    public async Task<IActionResult> CreateScreen(Guid venueId, [FromBody] CreateScreenRequest req, CancellationToken ct) =>
        Created(string.Empty, await _venues.CreateScreenAsync(_ctx, venueId, req, ct));

    [HttpPatch("screens/{screenId:guid}")]
    public async Task<IActionResult> UpdateScreen(Guid screenId, [FromBody] UpdateScreenRequest req, CancellationToken ct) =>
        Ok(await _venues.UpdateScreenAsync(_ctx, screenId, req, ct));

    [HttpDelete("screens/{screenId:guid}")]
    public async Task<IActionResult> DeleteScreen(Guid screenId, CancellationToken ct)
    {
        await _venues.DeleteScreenAsync(_ctx, screenId, ct);
        return NoContent();
    }

    // ── Shows ───────────────────────────────────────────────────────────
    [HttpGet("shows")]
    public async Task<IActionResult> GetShows(
        [FromQuery] Guid? venueId, [FromQuery] Guid? screenId,
        [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate,
        [FromQuery] string? status, [FromQuery] string? search,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var (items, total) = await _shows.GetShowsAsync(_ctx, venueId, screenId, fromDate, toDate, status, search, page, pageSize, ct);
        return Ok(new { items, total, page, pageSize, totalPages = (int)Math.Ceiling((double)total / pageSize) });
    }

    [HttpPost("shows")]
    public async Task<IActionResult> CreateShow([FromBody] CreatePartnerShowRequest req, CancellationToken ct) =>
        Created(string.Empty, await _shows.CreateShowAsync(_ctx, req, ct));

    [HttpPost("shows/{showId:guid}/cancel")]
    public async Task<IActionResult> CancelShow(Guid showId, CancellationToken ct)
    {
        await _shows.CancelShowAsync(_ctx, showId, ct);
        return Ok(new { message = "Show cancelled" });
    }

    [HttpDelete("shows/{showId:guid}")]
    public async Task<IActionResult> DeleteShow(Guid showId, CancellationToken ct)
    {
        await _shows.DeleteShowAsync(_ctx, showId, ct);
        return NoContent();
    }

    // ── Bookings ────────────────────────────────────────────────────────
    [HttpGet("bookings")]
    public async Task<IActionResult> GetBookings(
        [FromQuery] string? search, [FromQuery] string? status, [FromQuery] Guid? venueId,
        [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        CancellationToken ct = default) =>
        Ok(await _bookings.GetBookingsAsync(_ctx, search, status, venueId, fromDate, toDate, page, pageSize, ct));

    [HttpGet("bookings/{bookingRef}")]
    public async Task<IActionResult> GetBooking(string bookingRef, CancellationToken ct) =>
        Ok(await _bookings.GetBookingDetailAsync(_ctx, bookingRef, ct));

    [HttpPost("bookings/{bookingRef}/cancel")]
    public async Task<IActionResult> CancelBooking(string bookingRef, CancellationToken ct) =>
        Ok(await _bookings.CancelBookingAsync(_ctx, bookingRef, ct));

    // ── Reviews ─────────────────────────────────────────────────────────
    [HttpGet("reviews")]
    public async Task<IActionResult> GetReviews(
        [FromQuery] Guid? venueId, [FromQuery] string? status,
        [FromQuery] string sort = "recent",
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        CancellationToken ct = default) =>
        Ok(await _reviews.GetReviewsAsync(_ctx, venueId, status, sort, page, pageSize, ct));

    [HttpPost("reviews/{reviewId:guid}/hide")]
    public async Task<IActionResult> HideReview(Guid reviewId, CancellationToken ct)
    {
        await _reviews.HideReviewAsync(_ctx, reviewId, ct);
        return Ok(new { message = "Review hidden" });
    }

    [HttpPost("reviews/{reviewId:guid}/show")]
    [HttpPost("reviews/{reviewId:guid}/restore")]
    public async Task<IActionResult> ShowReview(Guid reviewId, CancellationToken ct)
    {
        await _reviews.ShowReviewAsync(_ctx, reviewId, ct);
        return Ok(new { message = "Review restored" });
    }

    [HttpGet("profile")]
    public IActionResult GetProfile() =>
        Ok(new { partnerId = _ctx.PartnerId, venueIds = _ctx.VenueIds });
}
