using BookKaroo.Application.DTOs.Home;
using BookKaroo.Application.DTOs.Movies;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("api/home")]
[Produces("application/json")]
public class HomeController : ControllerBase
{
    private readonly IMovieService     _movies;
    private readonly IEventService     _events;
    private readonly ICmsBannerService _banners;

    public HomeController(
        IMovieService     movies,
        IEventService     events,
        ICmsBannerService banners)
    {
        _movies  = movies;
        _events  = events;
        _banners = banners;
    }

    /// <summary>Aggregated home page data — all sections in one request.</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetHome([FromQuery] Guid? cityId, CancellationToken ct)
    {
        // Run sequentially — EF Core DbContext is not thread-safe; Task.WhenAll would
        // cause "second operation started" errors since all services share one scoped instance.
        var nowShowing = await _movies.GetListAsync(
            new MovieFilterRequest(Category: "NowShowing", CityId: cityId, Page: 1, PageSize: 10), ct);
        var comingSoon = await _movies.GetListAsync(
            new MovieFilterRequest(Category: "ComingSoon", Page: 1, PageSize: 8), ct);
        var liveEvents = await _events.GetByTypeAsync(EventType.LiveEvent, cityId, 6, ct);
        var plays      = await _events.GetByTypeAsync(EventType.Play,      cityId, 4, ct);
        var comedy     = await _events.GetByTypeAsync(EventType.Comedy,    cityId, 4, ct);
        var ipl        = await _events.GetByTypeAsync(EventType.Ipl,       null,   5, ct);
        var banners    = await _banners.GetActiveAsync(ct);

        return Ok(new HomeResponse(
            nowShowing.Items.ToList(),
            comingSoon.Items.ToList(),
            liveEvents,
            plays,
            comedy,
            ipl,
            banners));
    }
}
