using BookKaroo.Application.DTOs.Admin;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Produces("application/json")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _admin;

    public AdminController(IAdminService admin) => _admin = admin;

    // ── Dashboard ─────────────────────────────────────────────────────────────

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken ct) =>
        Ok(await _admin.GetDashboardAsync(ct));

    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? entityType,
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default) =>
        Ok(await _admin.GetAuditLogsAsync(entityType, page, pageSize, ct));

    [HttpPost("sync-tmdb")]
    public async Task<IActionResult> SyncTmdbPosters(CancellationToken ct)
    {
        var updated = await _admin.SyncTmdbPostersAsync(ct);
        return Ok(new { updated, message = $"Synced {updated} movie(s) from TMDB." });
    }

    // ── Movies ────────────────────────────────────────────────────────────────

    [HttpGet("movies")]
    public async Task<IActionResult> GetMovies(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? category,
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default) =>
        Ok(await _admin.GetMoviesAsync(search, status, category, page, pageSize, ct));

    [HttpGet("movies/{id:guid}")]
    public async Task<IActionResult> GetMovie(Guid id, CancellationToken ct)
    {
        try { return Ok(await _admin.GetMovieByIdAsync(id, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("movies")]
    public async Task<IActionResult> CreateMovie([FromBody] CreateMovieRequest req, CancellationToken ct)
    {
        var result = await _admin.CreateMovieAsync(req, ct);
        return Created($"/api/admin/movies/{result.Id}", result);
    }

    [HttpPatch("movies/{id:guid}")]
    public async Task<IActionResult> UpdateMovie(Guid id, [FromBody] UpdateMovieRequest req, CancellationToken ct)
    {
        try { return Ok(await _admin.UpdateMovieAsync(id, req, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("movies/{id:guid}")]
    public async Task<IActionResult> DeleteMovie(Guid id, CancellationToken ct)
    {
        try { await _admin.DeleteMovieAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("movies/sync-tmdb")]
    public async Task<IActionResult> SyncFromTmdb([FromBody] SyncTmdbRequest req, CancellationToken ct)
    {
        try { return Ok(await _admin.SyncFromTmdbAsync(req.TmdbId, ct)); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("movies/import-popular")]
    public async Task<IActionResult> ImportPopular(CancellationToken ct) =>
        Ok(await _admin.ImportPopularAsync(ct));

    // ── Events ────────────────────────────────────────────────────────────────

    [HttpGet("events")]
    public async Task<IActionResult> GetEvents(
        [FromQuery] string? search,
        [FromQuery] string? type,
        [FromQuery] string? status,
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default) =>
        Ok(await _admin.GetEventsAsync(search, type, status, page, pageSize, ct));

    [HttpGet("events/{id:guid}")]
    public async Task<IActionResult> GetEvent(Guid id, CancellationToken ct)
    {
        try { return Ok(await _admin.GetEventByIdAsync(id, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("events")]
    public async Task<IActionResult> CreateEvent([FromBody] CreateEventRequest req, CancellationToken ct)
    {
        var result = await _admin.CreateEventAsync(req, ct);
        return Created($"/api/admin/events/{result.Id}", result);
    }

    [HttpPatch("events/{id:guid}")]
    public async Task<IActionResult> UpdateEvent(Guid id, [FromBody] UpdateEventRequest req, CancellationToken ct)
    {
        try { return Ok(await _admin.UpdateEventAsync(id, req, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("events/{id:guid}")]
    public async Task<IActionResult> DeleteEvent(Guid id, CancellationToken ct)
    {
        try { await _admin.DeleteEventAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // ── Venues (for event form dropdown — simple list) ────────────────────────

    [HttpGet("venues/list")]
    public async Task<IActionResult> GetVenuesList(CancellationToken ct) =>
        Ok(await _admin.GetVenuesAsync(ct));

    // ── Venues CRUD ───────────────────────────────────────────────────────────

    [HttpGet("venues")]
    public async Task<IActionResult> GetVenues(
        [FromQuery] string? search,
        [FromQuery] Guid?   cityId,
        [FromQuery] string? chain,
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default) =>
        Ok(await _admin.GetVenuesPaginatedAsync(search, cityId, chain, page, pageSize, ct));

    [HttpGet("venues/{id:guid}")]
    public async Task<IActionResult> GetVenue(Guid id, CancellationToken ct)
    {
        try { return Ok(await _admin.GetVenueWithScreensAsync(id, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("venues")]
    public async Task<IActionResult> CreateVenue([FromBody] CreateVenueRequest req, CancellationToken ct)
    {
        try
        {
            var result = await _admin.CreateVenueAsync(req, ct);
            return Created($"/api/admin/venues/{result.Id}", result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [HttpPatch("venues/{id:guid}")]
    public async Task<IActionResult> UpdateVenue(Guid id, [FromBody] UpdateVenueRequest req, CancellationToken ct)
    {
        try { return Ok(await _admin.UpdateVenueAsync(id, req, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("venues/{id:guid}")]
    public async Task<IActionResult> DeleteVenue(Guid id, CancellationToken ct)
    {
        try
        {
            await _admin.DeleteVenueAsync(id, ct);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    // ── Screens ───────────────────────────────────────────────────────────────

    [HttpGet("venues/{venueId:guid}/screens")]
    public async Task<IActionResult> GetScreens(Guid venueId, CancellationToken ct)
    {
        try
        {
            var detail = await _admin.GetVenueWithScreensAsync(venueId, ct);
            return Ok(detail.Screens);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("venues/{venueId:guid}/screens")]
    public async Task<IActionResult> CreateScreen(Guid venueId, [FromBody] CreateScreenRequest req, CancellationToken ct)
    {
        try
        {
            var result = await _admin.CreateScreenAsync(venueId, req, ct);
            return Created($"/api/admin/screens/{result.Id}", result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (ArgumentException ex)   { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPatch("screens/{screenId:guid}")]
    public async Task<IActionResult> UpdateScreen(Guid screenId, [FromBody] UpdateScreenRequest req, CancellationToken ct)
    {
        try { return Ok(await _admin.UpdateScreenAsync(screenId, req, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("screens/{screenId:guid}")]
    public async Task<IActionResult> DeleteScreen(Guid screenId, CancellationToken ct)
    {
        try
        {
            await _admin.DeleteScreenAsync(screenId, ct);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    // ── Shows ─────────────────────────────────────────────────────────────────

    [HttpGet("shows")]
    public async Task<IActionResult> GetShows(
        [FromQuery] Guid?    movieId,
        [FromQuery] Guid?    venueId,
        [FromQuery] Guid?    screenId,
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        [FromQuery] string?  status,
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default) =>
        Ok(await _admin.GetShowsAsync(movieId, venueId, screenId, fromDate, toDate, status, page, pageSize, ct));

    [HttpPost("shows")]
    public async Task<IActionResult> CreateShow([FromBody] CreateShowRequest req, CancellationToken ct)
    {
        try
        {
            var result = await _admin.CreateShowAsync(req, ct);
            return Created($"/api/admin/shows/{result.ShowId}", result);
        }
        catch (KeyNotFoundException ex)    { return NotFound(new { error = ex.Message }); }
        catch (ArgumentException ex)       { return BadRequest(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { error = ex.Message }); }
    }

    [HttpPost("shows/{id:guid}/cancel")]
    public async Task<IActionResult> CancelShow(Guid id, CancellationToken ct)
    {
        try { return Ok(await _admin.CancelShowAsync(id, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("shows/{id:guid}")]
    public async Task<IActionResult> DeleteShow(Guid id, CancellationToken ct)
    {
        try
        {
            await _admin.DeleteShowAsync(id, ct);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // ── Admin Bookings ────────────────────────────────────────────────────────

    [HttpGet("bookings")]
    public async Task<IActionResult> GetBookings(
        [FromQuery] string?  search,
        [FromQuery] string?  status,
        [FromQuery] Guid?    movieId,
        [FromQuery] Guid?    cityId,
        [FromQuery] string?  fromDate,
        [FromQuery] string?  toDate,
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        DateOnly? from = DateOnly.TryParse(fromDate, out var fd) ? fd : null;
        DateOnly? to   = DateOnly.TryParse(toDate,   out var td) ? td : null;
        return Ok(await _admin.GetAdminBookingsAsync(search, status, movieId, cityId, from, to, page, pageSize, ct));
    }

    [HttpGet("bookings/{bookingRef}")]
    public async Task<IActionResult> GetBookingDetail(string bookingRef, CancellationToken ct)
    {
        try { return Ok(await _admin.GetAdminBookingDetailAsync(bookingRef, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("bookings/{bookingRef}/cancel")]
    public async Task<IActionResult> CancelBooking(string bookingRef, CancellationToken ct)
    {
        try { return Ok(await _admin.AdminCancelBookingAsync(bookingRef, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("bookings/{bookingRef}/refund")]
    public async Task<IActionResult> ProcessRefund(
        string bookingRef,
        [FromBody] AdminRefundRequest req,
        CancellationToken ct)
    {
        if (req.RefundAmount <= 0)
            return BadRequest(new { error = "RefundAmount must be greater than zero." });
        try { return Ok(await _admin.AdminProcessRefundAsync(bookingRef, req.RefundAmount, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("bookings/{bookingRef}/resend-email")]
    public async Task<IActionResult> ResendBookingEmail(string bookingRef, CancellationToken ct)
    {
        try
        {
            await _admin.ResendBookingEmailAsync(bookingRef, ct);
            return Ok(new { message = "Confirmation email resent" });
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // ── Admin Users ───────────────────────────────────────────────────────────

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] string? role,
        [FromQuery] bool?   isBlocked,
        [FromQuery] Guid?   cityId,
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default) =>
        Ok(await _admin.GetAdminUsersAsync(search, role, isBlocked, cityId, page, pageSize, ct));

    [HttpGet("users/{id:guid}")]
    public async Task<IActionResult> GetUserDetail(Guid id, CancellationToken ct)
    {
        try { return Ok(await _admin.GetAdminUserDetailAsync(id, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("users/{id:guid}/block")]
    public async Task<IActionResult> BlockUser(Guid id, CancellationToken ct)
    {
        try
        {
            await _admin.BlockUserAsync(id, ct);
            return Ok(new { message = "User has been blocked" });
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("users/{id:guid}/unblock")]
    public async Task<IActionResult> UnblockUser(Guid id, CancellationToken ct)
    {
        try
        {
            await _admin.UnblockUserAsync(id, ct);
            return Ok(new { message = "User has been unblocked" });
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("users/{id:guid}/reset-password")]
    public async Task<IActionResult> ResetPassword(Guid id, CancellationToken ct)
    {
        try
        {
            var tempPassword = await _admin.AdminResetPasswordAsync(id, ct);
            return Ok(new { tempPassword });
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // ── Reports ───────────────────────────────────────────────────────────────

    [HttpGet("reports/bookings")]
    public async Task<IActionResult> GetBookingReport(
        [FromQuery] string   fromDate,
        [FromQuery] string   toDate,
        [FromQuery] string   groupBy  = "day",
        [FromQuery] Guid?    cityId   = null,
        [FromQuery] Guid?    movieId  = null,
        [FromQuery] Guid?    venueId  = null,
        CancellationToken ct = default)
    {
        if (!DateOnly.TryParse(fromDate, out var from) || !DateOnly.TryParse(toDate, out var to))
            return BadRequest(new { error = "Invalid fromDate or toDate. Use yyyy-MM-dd." });
        return Ok(await _admin.GetBookingReportAsync(from, to, groupBy, cityId, movieId, venueId, ct));
    }

    [HttpGet("reports/bookings/export")]
    public async Task<IActionResult> ExportBookingReport(
        [FromQuery] string fromDate,
        [FromQuery] string toDate,
        [FromQuery] string groupBy = "day",
        [FromQuery] Guid?  cityId  = null,
        [FromQuery] Guid?  movieId = null,
        [FromQuery] Guid?  venueId = null,
        CancellationToken ct = default)
    {
        if (!DateOnly.TryParse(fromDate, out var from) || !DateOnly.TryParse(toDate, out var to))
            return BadRequest(new { error = "Invalid fromDate or toDate." });
        var bytes = await _admin.ExportBookingReportCsvAsync(from, to, groupBy, cityId, movieId, venueId, ct);
        return File(bytes, "text/csv", $"bookings-report-{from:yyyyMMdd}-{to:yyyyMMdd}.csv");
    }

    [HttpGet("reports/users")]
    public async Task<IActionResult> GetUserReport(
        [FromQuery] string fromDate,
        [FromQuery] string toDate,
        [FromQuery] string groupBy = "day",
        CancellationToken ct = default)
    {
        if (!DateOnly.TryParse(fromDate, out var from) || !DateOnly.TryParse(toDate, out var to))
            return BadRequest(new { error = "Invalid fromDate or toDate. Use yyyy-MM-dd." });
        return Ok(await _admin.GetUserAcquisitionReportAsync(from, to, groupBy, ct));
    }

    [HttpGet("reports/users/export")]
    public async Task<IActionResult> ExportUserReport(
        [FromQuery] string fromDate,
        [FromQuery] string toDate,
        [FromQuery] string groupBy = "day",
        CancellationToken ct = default)
    {
        if (!DateOnly.TryParse(fromDate, out var from) || !DateOnly.TryParse(toDate, out var to))
            return BadRequest(new { error = "Invalid fromDate or toDate." });
        var bytes = await _admin.ExportUserReportCsvAsync(from, to, groupBy, ct);
        return File(bytes, "text/csv", $"users-report-{from:yyyyMMdd}-{to:yyyyMMdd}.csv");
    }

    // ── CMS Banners ───────────────────────────────────────────────────────────

    [HttpGet("banners")]
    public async Task<IActionResult> GetBanners(CancellationToken ct) =>
        Ok(await _admin.GetBannersAdminAsync(ct));

    [HttpGet("banners/{id:guid}")]
    public async Task<IActionResult> GetBanner(Guid id, CancellationToken ct)
    {
        try { return Ok(await _admin.GetBannerByIdAsync(id, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("banners")]
    public async Task<IActionResult> CreateBanner([FromBody] CreateBannerRequest req, CancellationToken ct)
    {
        var result = await _admin.CreateBannerAsync(req, ct);
        return Created($"/api/admin/banners/{result.Id}", result);
    }

    [HttpPatch("banners/{id:guid}")]
    public async Task<IActionResult> UpdateBanner(Guid id, [FromBody] UpdateBannerRequest req, CancellationToken ct)
    {
        try { return Ok(await _admin.UpdateBannerAsync(id, req, ct)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("banners/{id:guid}")]
    public async Task<IActionResult> DeleteBanner(Guid id, CancellationToken ct)
    {
        try { await _admin.DeleteBannerAsync(id, ct); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("banners/reorder")]
    public async Task<IActionResult> ReorderBanners([FromBody] ReorderBannersRequest req, CancellationToken ct)
    {
        await _admin.ReorderBannersAsync(req.OrderedIds, ct);
        return Ok(new { message = "Banners reordered" });
    }

    [HttpPatch("banners/{id:guid}/toggle")]
    public async Task<IActionResult> ToggleBanner(Guid id, [FromBody] ToggleBannerRequest req, CancellationToken ct)
    {
        await _admin.ToggleBannerAsync(id, req.IsActive, ct);
        return Ok();
    }

    // ── Settings ──────────────────────────────────────────────────────────────

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings(CancellationToken ct) =>
        Ok(await _admin.GetAllSettingsAsync(ct));

    [HttpGet("settings/{key}")]
    public async Task<IActionResult> GetSetting(string key, CancellationToken ct)
    {
        var result = await _admin.GetSettingAsync(key, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPatch("settings/{key}")]
    public async Task<IActionResult> UpdateSetting(string key, [FromBody] UpdateSettingValueRequest req, CancellationToken ct) =>
        Ok(await _admin.UpdateSettingAsync(key, req.Value, ct));

    [HttpPost("settings/batch")]
    public async Task<IActionResult> UpdateSettingsBatch([FromBody] BatchUpdateSettingsRequest req, CancellationToken ct)
    {
        await _admin.UpdateMultipleSettingsAsync(req.Settings, ct);
        return Ok(new { message = "Settings updated", count = req.Settings.Count });
    }
}
