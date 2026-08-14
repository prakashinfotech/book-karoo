using BookKaroo.Application.DTOs.Shows;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("api/shows")]
[Produces("application/json")]
public class ShowsController : ControllerBase
{
    private readonly IShowService _shows;

    public ShowsController(IShowService shows) => _shows = shows;

    /// <summary>Showtimes for a movie grouped by venue (city-aware).</summary>
    [HttpGet("/api/movies/{movieId:guid}/showtimes")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ShowtimesGroupedResponse), 200)]
    public async Task<IActionResult> GetShowtimes(
        Guid movieId,
        [FromQuery] Guid    cityId,
        [FromQuery] string? date,
        CancellationToken   ct)
    {
        var showDate = date is not null
            ? DateOnly.Parse(date)
            : DateOnly.FromDateTime(DateTime.Today);

        return Ok(await _shows.GetShowtimesAsync(movieId, cityId, showDate, ct));
    }

    /// <summary>Seat availability for a specific show.</summary>
    [HttpGet("{showId:guid}/seats")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ShowSeatsResponse), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetSeats(Guid showId, CancellationToken ct)
        => Ok(await _shows.GetSeatsAsync(showId, ct));
}
