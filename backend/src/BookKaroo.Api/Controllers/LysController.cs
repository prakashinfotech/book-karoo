using System.Security.Claims;
using BookKaroo.Application.DTOs.Lys;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("api/lys")]
[Produces("application/json")]
[Authorize]
public class LysController : ControllerBase
{
    private readonly ILysOrganizerService _organizers;
    private readonly ILysEventService     _events;
    private readonly IVenueRepository     _venues;
    private readonly ICityRepository      _cities;

    public LysController(
        ILysOrganizerService organizers,
        ILysEventService     events,
        IVenueRepository     venues,
        ICityRepository      cities)
    {
        _organizers = organizers;
        _events     = events;
        _venues     = venues;
        _cities     = cities;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ── Organizer profile ─────────────────────────────────────────────────────

    [HttpGet("organizer/me")]
    public async Task<IActionResult> GetMyProfile(CancellationToken ct)
    {
        var profile = await _organizers.GetMyProfileAsync(GetUserId(), ct);
        return profile == null ? NotFound(new { message = "Organizer profile not found." }) : Ok(profile);
    }

    [HttpPost("organizer/register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterOrganizerRequest req, CancellationToken ct)
    {
        var result = await _organizers.RegisterAsync(req, GetUserId(), ct);
        return Created($"/api/lys/organizer/me", result);
    }

    [HttpPatch("organizer/me")]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateOrganizerRequest req, CancellationToken ct) =>
        Ok(await _organizers.UpdateProfileAsync(GetUserId(), req, ct));

    // ── Events ────────────────────────────────────────────────────────────────

    [HttpGet("events")]
    public async Task<IActionResult> GetMyEvents(
        [FromQuery] string? status,
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var organizer = await _organizers.GetMyProfileAsync(GetUserId(), ct)
            ?? throw new NotFoundException("Organizer profile not found.");

        var (items, total) = await _events.GetMyEventsAsync(organizer.Id, status, page, pageSize, ct);
        return Ok(new { items, total, page, pageSize, totalPages = (int)Math.Ceiling((double)total / pageSize) });
    }

    [HttpGet("events/{id:guid}")]
    public async Task<IActionResult> GetEvent(Guid id, CancellationToken ct)
    {
        var organizer = await _organizers.GetMyProfileAsync(GetUserId(), ct)
            ?? throw new NotFoundException("Organizer profile not found.");
        return Ok(await _events.GetByIdAsync(organizer.Id, id, ct));
    }

    [HttpPost("events")]
    public async Task<IActionResult> CreateEvent(
        [FromBody] CreateLysEventRequest req, CancellationToken ct)
    {
        var organizer = await _organizers.GetMyProfileAsync(GetUserId(), ct)
            ?? throw new NotFoundException("Organizer profile not found. Register as an organizer first.");
        var result = await _events.CreateDraftAsync(organizer.Id, req, ct);
        return Created($"/api/lys/events/{result.Id}", result);
    }

    [HttpPatch("events/{id:guid}")]
    public async Task<IActionResult> UpdateEvent(
        Guid id, [FromBody] UpdateLysEventRequest req, CancellationToken ct)
    {
        var organizer = await _organizers.GetMyProfileAsync(GetUserId(), ct)
            ?? throw new NotFoundException("Organizer profile not found.");
        return Ok(await _events.UpdateDraftAsync(organizer.Id, id, req, ct));
    }

    [HttpPost("events/{id:guid}/submit")]
    public async Task<IActionResult> Submit(Guid id, CancellationToken ct)
    {
        var organizer = await _organizers.GetMyProfileAsync(GetUserId(), ct)
            ?? throw new NotFoundException("Organizer profile not found.");
        return Ok(await _events.SubmitForReviewAsync(organizer.Id, id, ct));
    }

    [HttpDelete("events/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var organizer = await _organizers.GetMyProfileAsync(GetUserId(), ct)
            ?? throw new NotFoundException("Organizer profile not found.");
        await _events.DeleteDraftAsync(organizer.Id, id, ct);
        return NoContent();
    }

    [HttpPost("events/{id:guid}/upload-poster")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> UploadPoster(Guid id, IFormFile file, CancellationToken ct)
    {
        var organizer = await _organizers.GetMyProfileAsync(GetUserId(), ct)
            ?? throw new NotFoundException("Organizer profile not found.");
        await using var stream = file.OpenReadStream();
        var result = await _events.UploadImageAsync(
            organizer.Id, id, stream, file.FileName, file.ContentType, "poster", ct);
        return Ok(new { posterUrl = result.PublicUrl });
    }

    [HttpPost("events/{id:guid}/upload-backdrop")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> UploadBackdrop(Guid id, IFormFile file, CancellationToken ct)
    {
        var organizer = await _organizers.GetMyProfileAsync(GetUserId(), ct)
            ?? throw new NotFoundException("Organizer profile not found.");
        await using var stream = file.OpenReadStream();
        var result = await _events.UploadImageAsync(
            organizer.Id, id, stream, file.FileName, file.ContentType, "backdrop", ct);
        return Ok(new { backdropUrl = result.PublicUrl });
    }

    [HttpGet("events/check-duplicates")]
    public async Task<IActionResult> CheckDuplicates(
        [FromQuery] string title,
        [FromQuery] DateTime date,
        CancellationToken ct)
    {
        var organizer = await _organizers.GetMyProfileAsync(GetUserId(), ct)
            ?? throw new NotFoundException("Organizer profile not found.");
        var dupes = await _events.CheckDuplicatesAsync(organizer.Id, title, date, ct);
        return Ok(dupes);
    }

    [HttpGet("venues")]
    [AllowAnonymous]
    public async Task<IActionResult> GetVenues(CancellationToken ct)
    {
        var venues = (await _venues.GetAllAsync(ct)).ToList();
        var citiesMap = (await _cities.GetAllAsync(ct)).ToDictionary(c => c.Id, c => c.Name);
        var result = venues
            .OrderBy(v => v.Name)
            .Select(v => new { v.Id, v.Name, CityName = citiesMap.GetValueOrDefault(v.CityId, "") });
        return Ok(result);
    }

    [HttpGet("commission-rate")]
    [AllowAnonymous]
    public IActionResult GetCommissionRate() =>
        Ok(new { rate = 5.0 });
}
