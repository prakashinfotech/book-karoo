using System.Security.Claims;
using BookKaroo.Application.DTOs.Movies;
using BookKaroo.Application.DTOs.Reviews;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("api/movies")]
[Produces("application/json")]
public class MoviesController : ControllerBase
{
    private readonly IMovieService       _movies;
    private readonly IReviewService      _reviews;
    private readonly IRemindMeRepository _remindMe;

    public MoviesController(
        IMovieService       movies,
        IReviewService      reviews,
        IRemindMeRepository remindMe)
    {
        _movies   = movies;
        _reviews  = reviews;
        _remindMe = remindMe;
    }

    /// <summary>List published movies with optional filters and pagination.</summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(MovieListPagedResponse), 200)]
    public async Task<IActionResult> GetList([FromQuery] MovieFilterRequest filter, CancellationToken ct)
        => Ok(await _movies.GetListAsync(filter, ct));

    /// <summary>Full movie detail by slug (cast, crew, rating summary, related).</summary>
    [HttpGet("{slug}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(MovieDetailResponse), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetDetail(string slug, CancellationToken ct)
    {
        Guid? userId = null;
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (claim is not null && Guid.TryParse(claim, out var uid)) userId = uid;

        return Ok(await _movies.GetDetailAsync(slug, userId, ct));
    }

    /// <summary>Showtimes for a movie grouped by venue.</summary>
    [HttpGet("{slug}/showtimes")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ShowtimesResponse), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetShowtimes(string slug, [FromQuery] string? date, CancellationToken ct)
        => Ok(await _movies.GetShowtimesAsync(slug, date, ct));

    /// <summary>Paginated reviews for a movie.</summary>
    [HttpGet("{movieId:guid}/reviews")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PaginatedReviewResponse), 200)]
    public async Task<IActionResult> GetReviews(
        Guid movieId,
        [FromQuery] string sort     = "recent",
        [FromQuery] int    page     = 1,
        [FromQuery] int    pageSize = 10,
        CancellationToken ct = default)
        => Ok(await _reviews.GetByMovieAsync(movieId, sort, page, pageSize, ct));

    /// <summary>Submit a review (requires a confirmed booking for this movie).</summary>
    [HttpPost("{movieId:guid}/reviews")]
    [Authorize]
    [ProducesResponseType(typeof(ReviewResponse), 201)]
    [ProducesResponseType(403)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> CreateReview(
        Guid movieId, [FromBody] CreateReviewRequest req, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _reviews.CreateAsync(userId, movieId, req, ct);
        return StatusCode(201, result);
    }

    /// <summary>Check if the authenticated user has opted in to a release reminder.</summary>
    [HttpGet("{movieId:guid}/remind-me")]
    [Authorize]
    [ProducesResponseType(200)]
    public async Task<IActionResult> GetRemindMeStatus(Guid movieId, CancellationToken ct)
    {
        var userId   = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var optedIn  = await _remindMe.HasOptedInAsync(userId, movieId, ct);
        return Ok(new { optedIn });
    }

    /// <summary>Opt in to release reminder (idempotent).</summary>
    [HttpPost("{movieId:guid}/remind-me")]
    [Authorize]
    [ProducesResponseType(200)]
    public async Task<IActionResult> RemindMe(Guid movieId, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        if (await _remindMe.HasOptedInAsync(userId, movieId, ct))
            return Ok(new { message = "You're already on the remind list!", optedIn = true });

        await _remindMe.AddAsync(new RemindMe { UserId = userId, MovieId = movieId, Notified = false }, ct);
        return Ok(new { message = "We'll notify you when it releases!", optedIn = true });
    }
}
