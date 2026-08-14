using BookKaroo.Application.DTOs.Search;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("api/search")]
[Produces("application/json")]
public class SearchController : ControllerBase
{
    private readonly ISearchService _search;

    public SearchController(ISearchService search) => _search = search;

    /// <summary>Global search across movies, events, venues, and cities.</summary>
    [HttpGet]
    [AllowAnonymous]
    [ResponseCache(Duration = 30, Location = ResponseCacheLocation.Any)]
    [ProducesResponseType(typeof(SearchResponse), 200)]
    public async Task<IActionResult> Search(
        [FromQuery] string q        = "",
        [FromQuery] Guid?  cityId   = null,
        CancellationToken  ct       = default)
    {
        if (q.Length < 2)
            return Ok(new SearchResponse([], [], [], [], q, 0));

        return Ok(await _search.SearchAsync(q, cityId, ct));
    }
}
