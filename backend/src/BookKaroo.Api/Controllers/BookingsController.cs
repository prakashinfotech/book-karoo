using System.Security.Claims;
using BookKaroo.Application.DTOs.Booking;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("api/bookings")]
[Produces("application/json")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookings;

    public BookingsController(IBookingService bookings) => _bookings = bookings;

    /// <summary>List bookings for the authenticated user.</summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(PaginatedBookings), 200)]
    public async Task<IActionResult> GetMine(
        [FromQuery] string? tab,
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok(await _bookings.GetByUserAsync(userId, tab, page, pageSize, ct));
    }

    /// <summary>Get booking detail by booking reference.</summary>
    [HttpGet("{ref}")]
    [ProducesResponseType(typeof(BookingDetailResponse), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetByRef(string @ref, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok(await _bookings.GetByRefAsync(@ref, userId, ct));
    }

    /// <summary>Download GST invoice PDF for a booking (generated on demand).</summary>
    [HttpGet("{ref}/invoice")]
    [Produces("application/pdf")]
    [ProducesResponseType(typeof(FileContentResult), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DownloadInvoice(string @ref, CancellationToken ct)
    {
        var userId  = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var pdfBytes = await _bookings.GenerateInvoicePdfAsync(@ref, userId, ct);
        return File(pdfBytes, "application/pdf", $"{@ref}_GST_Invoice.pdf");
    }

    /// <summary>Cancel a confirmed booking.</summary>
    [HttpPost("{ref}/cancel")]
    [ProducesResponseType(typeof(CancelResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Cancel(string @ref, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok(await _bookings.CancelAsync(@ref, userId, ct));
    }
}
