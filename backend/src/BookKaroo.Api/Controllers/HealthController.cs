using System.Diagnostics;
using BookKaroo.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("health")]
[AllowAnonymous]
public class HealthController : ControllerBase
{
    private readonly BookKarooDbContext _db;
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _env;

    public HealthController(
        BookKarooDbContext db,
        IConfiguration config,
        IWebHostEnvironment env)
    {
        _db     = db;
        _config = config;
        _env    = env;
    }

    /// <summary>Enhanced health check with component-level status.</summary>
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        // DB check
        string dbStatus = "ok";
        long dbMs = 0;

        try
        {
            var sw = Stopwatch.StartNew();
            await _db.Database.ExecuteSqlRawAsync("SELECT 1", ct);
            sw.Stop();
            dbMs = sw.ElapsedMilliseconds;
        }
        catch
        {
            dbStatus = "error";
        }

        // External service checks (env var presence only)
        var resendStatus = string.IsNullOrWhiteSpace(_config["RESEND_API_KEY"])
            ? "not configured"
            : "configured";

        var tmdbStatus = string.IsNullOrWhiteSpace(_config["TMDB_BEARER"])
            ? "not configured"
            : "configured";

        var overallStatus = dbStatus == "ok" ? "ok" : "degraded";

        return Ok(new
        {
            status      = overallStatus,
            environment = _env.EnvironmentName,
            version     = "1.0.0",
            db          = dbStatus,
            checks      = new
            {
                database = new { status = dbStatus, responseMs = dbMs },
                resend   = new { status = resendStatus },
                tmdb     = new { status = tmdbStatus },
            }
        });
    }
}
