using BookKaroo.Application.DTOs.Help;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("api/help")]
[Produces("application/json")]
public class HelpController : ControllerBase
{
    private readonly IEmailService      _email;
    private readonly ISettingRepository _settings;
    private readonly ILogger<HelpController> _logger;

    public HelpController(
        IEmailService      email,
        ISettingRepository settings,
        ILogger<HelpController> logger)
    {
        _email    = email;
        _settings = settings;
        _logger   = logger;
    }

    /// <summary>Submit a support / contact request.</summary>
    [HttpPost("contact")]
    [AllowAnonymous]
    public async Task<IActionResult> Contact(
        [FromBody] ContactRequest req,
        CancellationToken ct)
    {
        var supportEmail = await _settings.GetAsync("support_email", ct)
            ?? "support@bookkaroo.com";

        _logger.LogInformation(
            "Support contact from {Email} — subject: {Subject}", req.Email, req.Subject);

        await _email.SendContactSupportAsync(
            req.Name, req.Email, req.Subject, req.Message,
            req.BookingRef, supportEmail, ct);

        return Ok(new { message = "Your message has been sent. We'll respond within 24 hours." });
    }
}
