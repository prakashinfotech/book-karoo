using BookKaroo.Application.Interfaces.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("api/settings")]
[Produces("application/json")]
public class SettingsController : ControllerBase
{
    private readonly ISettingRepository _settings;

    public SettingsController(ISettingRepository settings) => _settings = settings;

    // Public subset of settings that the frontend needs at runtime.
    // Do NOT expose sensitive keys (GSTIN, PAN, secrets).
    private static readonly HashSet<string> PublicKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "convenience_fee_per_ticket",
        "offer_processing_fee",
        "gst_rate",
        "max_seats_per_booking",
        "seat_lock_minutes",
        "cancellation_window_hours",
        "refund_processing_days",
        "support_email",
        "support_url",
        "company_state_code",
        "payment_provider",
    };

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicSettings(CancellationToken ct)
    {
        var all = await _settings.GetAllAsync(ct);
        var result = all
            .Where(kv => PublicKeys.Contains(kv.Key))
            .ToDictionary(kv => kv.Key, kv => kv.Value);
        return Ok(result);
    }
}
