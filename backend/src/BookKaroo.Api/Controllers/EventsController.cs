using System.Security.Claims;
using BookKaroo.Application.DTOs.Events;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("api/events")]
[Produces("application/json")]
public class EventsController : ControllerBase
{
    private readonly IEventService              _events;
    private readonly IRemindMeRepository        _remindMe;
    private readonly IEventTicketLockRepository _eventLockRepo;
    private readonly IBookingService            _bookingService;
    private readonly IEventRepository           _eventRepo;

    public EventsController(
        IEventService              events,
        IRemindMeRepository        remindMe,
        IEventTicketLockRepository eventLockRepo,
        IBookingService            bookingService,
        IEventRepository           eventRepo)
    {
        _events         = events;
        _remindMe       = remindMe;
        _eventLockRepo  = eventLockRepo;
        _bookingService = bookingService;
        _eventRepo      = eventRepo;
    }

    /// <summary>List published upcoming events with optional type and city filters.</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetList(
        [FromQuery] string? type     = null,
        [FromQuery] Guid?   cityId   = null,
        [FromQuery] int     page     = 1,
        [FromQuery] int     pageSize = 20,
        CancellationToken ct = default)
    {
        var parsedType = ParseEventType(type);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (items, total, totalPages) = await _events.GetListAsync(parsedType, cityId, page, pageSize, ct);
        return Ok(new { items, total, page, pageSize, totalPages });
    }

    /// <summary>Full event detail by slug.</summary>
    [HttpGet("{slug}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetDetail(string slug, CancellationToken ct)
        => Ok(await _events.GetDetailAsync(slug, ct));

    /// <summary>Upcoming events by type (used for home page rails).</summary>
    [HttpGet("upcoming/{type}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetUpcoming(
        string type,
        [FromQuery] Guid? cityId = null,
        [FromQuery] int   count  = 6,
        CancellationToken ct = default)
    {
        var parsedType = ParseEventType(type);
        if (!parsedType.HasValue)
            return BadRequest(new { message = $"Unknown event type: {type}" });

        count = Math.Clamp(count, 1, 20);
        var result = await _events.GetByTypeAsync(parsedType.Value, cityId, count, ct);
        return Ok(result);
    }

    /// <summary>Opt in to event availability notification (idempotent).</summary>
    [HttpPost("{id:guid}/remind-me")]
    [Authorize]
    public async Task<IActionResult> RemindMe(Guid id, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        if (await _remindMe.HasOptedInForEventAsync(userId, id, ct))
            return Ok(new { message = "You're already on the remind list!" });

        await _remindMe.AddAsync(new RemindMe { UserId = userId, EventId = id, Notified = false }, ct);
        return Ok(new { message = "We'll notify you when tickets are available!" });
    }

    /// <summary>Get tier availability for an event.</summary>
    [HttpGet("{id:guid}/availability")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvailability(Guid id, CancellationToken ct)
    {
        var ev = await _eventRepo.GetByIdAsync(id, ct);
        if (ev == null) return NotFound();
        var availability = await _eventLockRepo.GetTierAvailabilityAsync(id, ev.PriceTiers ?? "[]", ct);
        return Ok(new { tiers = availability.Values });
    }

    /// <summary>Create an event order (reserve tickets and create payment order).</summary>
    [HttpPost("order")]
    [Authorize]
    public async Task<IActionResult> CreateEventOrder(
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyKeyHeader,
        [FromBody] CreateEventOrderRequest request,
        CancellationToken ct)
    {
        if (request.Quantity < 1 || request.Quantity > 10)
            return BadRequest(new { error = "Quantity must be between 1 and 10." });

        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var effectiveKey = idempotencyKeyHeader ?? request.IdempotencyKey;
        var req = request with { IdempotencyKey = effectiveKey };

        try
        {
            return Ok(await _bookingService.CreateEventOrderAsync(req, userId, ct));
        }
        catch (NotFoundException ex)          { return NotFound(new { error = ex.Message }); }
        catch (ConflictException ex)          { return Conflict(new { error = ex.Message }); }
        catch (ArgumentException ex)          { return BadRequest(new { error = ex.Message }); }
        catch (InvalidOperationException ex)  { return Conflict(new { error = ex.Message }); }
    }

    private static EventType? ParseEventType(string? type) => type?.ToLowerInvariant() switch
    {
        "live_event" or "liveevent" => EventType.LiveEvent,
        "play"                      => EventType.Play,
        "sport"                     => EventType.Sport,
        "activity"                  => EventType.Activity,
        "comedy"                    => EventType.Comedy,
        "ipl"                       => EventType.Ipl,
        _                           => null
    };
}
