using System.Security.Claims;
using BookKaroo.Application.DTOs.Partner;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("api/admin/partners")]
[Authorize(Roles = "Admin")]
public class AdminPartnerController : ControllerBase
{
    private readonly IAdminPartnerService _service;

    public AdminPartnerController(IAdminPartnerService service) => _service = service;

    private Guid? CurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search, [FromQuery] bool? isActive,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        CancellationToken ct = default) =>
        Ok(await _service.GetAllAsync(search, isActive, page, pageSize, ct));

    [HttpGet("{partnerId:guid}")]
    public async Task<IActionResult> GetById(Guid partnerId, CancellationToken ct) =>
        Ok(await _service.GetByIdAsync(partnerId, ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePartnerRequest req, CancellationToken ct) =>
        Created(string.Empty, await _service.CreatePartnerAsync(req, CurrentUserId(), ct));

    [HttpPatch("{partnerId:guid}")]
    public async Task<IActionResult> Update(Guid partnerId, [FromBody] UpdatePartnerRequest req, CancellationToken ct) =>
        Ok(await _service.UpdatePartnerAsync(partnerId, req, ct));

    [HttpPost("{partnerId:guid}/activate")]
    public async Task<IActionResult> Activate(Guid partnerId, CancellationToken ct) =>
        Ok(await _service.SetActiveAsync(partnerId, true, ct));

    [HttpPost("{partnerId:guid}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid partnerId, CancellationToken ct) =>
        Ok(await _service.SetActiveAsync(partnerId, false, ct));

    [HttpPost("{partnerId:guid}/venues")]
    public async Task<IActionResult> GrantVenue(Guid partnerId, [FromBody] GrantVenueAccessRequest req, CancellationToken ct) =>
        Ok(await _service.GrantVenueAccessAsync(partnerId, req.VenueId, CurrentUserId(), ct));

    [HttpDelete("{partnerId:guid}/venues/{venueId:guid}")]
    public async Task<IActionResult> RevokeVenue(Guid partnerId, Guid venueId, CancellationToken ct) =>
        Ok(await _service.RevokeVenueAccessAsync(partnerId, venueId, ct));
}
