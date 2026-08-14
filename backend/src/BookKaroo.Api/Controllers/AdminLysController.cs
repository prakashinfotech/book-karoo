using System.Security.Claims;
using BookKaroo.Application.DTOs.Lys;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("api/admin/lys")]
[Produces("application/json")]
[Authorize(Roles = "Admin")]
public class AdminLysController : ControllerBase
{
    private readonly ILysAdminService _admin;

    public AdminLysController(ILysAdminService admin) => _admin = admin;

    private Guid GetAdminId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ── Submissions ───────────────────────────────────────────────────────────

    [HttpGet("submissions")]
    public async Task<IActionResult> GetSubmissions(
        [FromQuery] string?  search,
        [FromQuery] string?  status,
        [FromQuery] string?  type,
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var (items, total) = await _admin.GetSubmissionsAsync(
            search, status, type, fromDate, toDate, page, pageSize, ct);
        return Ok(new { items, total, page, pageSize, totalPages = (int)Math.Ceiling((double)total / pageSize) });
    }

    [HttpGet("submissions/{id:guid}")]
    public async Task<IActionResult> GetSubmission(Guid id, CancellationToken ct) =>
        Ok(await _admin.GetSubmissionDetailAsync(id, ct));

    [HttpPost("submissions/{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct) =>
        Ok(await _admin.ApproveEventAsync(id, GetAdminId(), ct));

    [HttpPost("submissions/{id:guid}/reject")]
    public async Task<IActionResult> Reject(
        Guid id, [FromBody] AdminReviewRequest req, CancellationToken ct) =>
        Ok(await _admin.RejectEventAsync(id, GetAdminId(), req.Reason, ct));

    [HttpPost("submissions/{id:guid}/request-changes")]
    public async Task<IActionResult> RequestChanges(
        Guid id, [FromBody] AdminChangesRequest req, CancellationToken ct) =>
        Ok(await _admin.RequestChangesAsync(id, GetAdminId(), req.Notes, ct));

    // ── Organizers ────────────────────────────────────────────────────────────

    [HttpGet("organizers")]
    public async Task<IActionResult> GetOrganizers(
        [FromQuery] string? search,
        [FromQuery] bool?   isVerified,
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var (items, total) = await _admin.GetOrganizersAsync(search, isVerified, page, pageSize, ct);
        return Ok(new { items, total, page, pageSize, totalPages = (int)Math.Ceiling((double)total / pageSize) });
    }

    [HttpPost("organizers/{id:guid}/verify")]
    public async Task<IActionResult> Verify(Guid id, CancellationToken ct)
    {
        await _admin.VerifyOrganizerAsync(id, GetAdminId(), ct);
        return Ok(new { message = "Organizer verified." });
    }

    [HttpPost("organizers/{id:guid}/unverify")]
    public async Task<IActionResult> Unverify(Guid id, CancellationToken ct)
    {
        await _admin.UnverifyOrganizerAsync(id, ct);
        return Ok(new { message = "Organizer unverified." });
    }

    [HttpPost("organizers/{id:guid}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        await _admin.DeactivateOrganizerAsync(id, ct);
        return Ok(new { message = "Organizer deactivated." });
    }

    [HttpPost("events/{id:guid}/unpublish")]
    public async Task<IActionResult> Unpublish(
        Guid id, [FromBody] UnpublishLysRequest req, CancellationToken ct)
    {
        return Ok(await _admin.UnpublishEventAsync(id, GetAdminId(), req.Reason, ct));
    }
}

public record UnpublishLysRequest(string Reason);
