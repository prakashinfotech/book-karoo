using BookKaroo.Application.Common;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("api/partner/lys")]
[Authorize(Roles = "Partner,Admin")]
public class PartnerLysController : ControllerBase
{
    private readonly IPartnerContext    _ctx;
    private readonly ILysPartnerService _lys;

    public PartnerLysController(IPartnerContext ctx, ILysPartnerService lys)
    {
        _ctx = ctx;
        _lys = lys;
    }

    [HttpGet]
    public async Task<IActionResult> GetSubmissions(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var venueIds = _ctx.VenueIds.ToList();
        var (items, total) = await _lys.GetSubmissionsAsync(_ctx.PartnerId, venueIds, status, page, pageSize, ct);
        return Ok(new { items, total, page, pageSize, totalPages = pageSize > 0 ? (int)Math.Ceiling((double)total / pageSize) : 0 });
    }

    [HttpGet("{eventId:guid}")]
    public async Task<IActionResult> GetDetail(Guid eventId, CancellationToken ct = default)
    {
        var venueIds = _ctx.VenueIds.ToList();
        return Ok(await _lys.GetSubmissionDetailAsync(_ctx.PartnerId, venueIds, eventId, ct));
    }

    [HttpPost("{eventId:guid}/approve")]
    public async Task<IActionResult> Approve(Guid eventId, CancellationToken ct = default)
    {
        var venueIds = _ctx.VenueIds.ToList();
        return Ok(await _lys.ApproveAsync(_ctx.PartnerId, venueIds, eventId, ct));
    }

    [HttpPost("{eventId:guid}/reject")]
    public async Task<IActionResult> Reject(
        Guid eventId,
        [FromBody] RejectPartnerLysRequest req,
        CancellationToken ct = default)
    {
        var venueIds = _ctx.VenueIds.ToList();
        return Ok(await _lys.RejectAsync(_ctx.PartnerId, venueIds, eventId, req.Reason, ct));
    }

    [HttpPost("{eventId:guid}/request-changes")]
    public async Task<IActionResult> RequestChanges(
        Guid eventId,
        [FromBody] RequestChangesPartnerLysRequest req,
        CancellationToken ct = default)
    {
        var venueIds = _ctx.VenueIds.ToList();
        return Ok(await _lys.RequestChangesAsync(_ctx.PartnerId, venueIds, eventId, req.Notes, ct));
    }

    [HttpGet("pending-count")]
    public async Task<IActionResult> GetPendingCount(CancellationToken ct = default)
    {
        var venueIds = _ctx.VenueIds.ToList();
        var count = await _lys.GetPendingCountAsync(_ctx.PartnerId, venueIds, ct);
        return Ok(new { count });
    }
}

public record RejectPartnerLysRequest(string Reason);
public record RequestChangesPartnerLysRequest(string Notes);
