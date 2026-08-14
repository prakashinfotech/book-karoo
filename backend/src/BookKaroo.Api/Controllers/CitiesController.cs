using BookKaroo.Application.DTOs.Cities;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("api/cities")]
[Produces("application/json")]
public class CitiesController : ControllerBase
{
    private readonly ICityService _cities;

    public CitiesController(ICityService cities) => _cities = cities;

    /// <summary>Get all active cities.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<CityResponse>), 200)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var cities = await _cities.GetAllAsync(ct);
        return Ok(cities);
    }

    /// <summary>Detect city from caller's IP address.</summary>
    [HttpGet("detect")]
    [ProducesResponseType(typeof(CityResponse), 200)]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Detect(CancellationToken ct)
    {
        // In production behind a proxy, X-Forwarded-For has the real client IP.
        // RemoteIpAddress is the proxy IP, so check the header first.
        var ip = Request.Headers["X-Forwarded-For"].FirstOrDefault()
              ?? HttpContext.Connection.RemoteIpAddress?.ToString()
              ?? "0.0.0.0";

        var city = await _cities.DetectFromIpAsync(ip, ct);
        return city != null ? Ok(city) : NoContent();
    }
}
