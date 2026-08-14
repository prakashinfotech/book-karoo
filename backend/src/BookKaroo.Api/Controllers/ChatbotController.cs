using System.Security.Claims;
using BookKaroo.Application.DTOs.Chatbot;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("api/chatbot")]
[Produces("application/json")]
[AllowAnonymous]
public class ChatbotController : ControllerBase
{
    private readonly IChatbotService  _chatbot;
    private readonly IConfiguration   _config;

    public ChatbotController(IChatbotService chatbot, IConfiguration config)
    {
        _chatbot = chatbot;
        _config  = config;
    }

    /// <summary>Send a message to the BookKaroo AI assistant.</summary>
    [HttpPost("message")]
    [ProducesResponseType(typeof(ChatbotMessageResponse), 200)]
    [ProducesResponseType(503)]
    public async Task<IActionResult> PostMessage(
        [FromBody] ChatbotMessageRequest request,
        CancellationToken ct = default)
    {
        var enabled = _config["CHATBOT_ENABLED"];
        if (string.Equals(enabled, "false", StringComparison.OrdinalIgnoreCase))
            return StatusCode(503, new { message = "Chatbot is currently disabled." });

        Guid?   userId   = null;
        string? userName = null;

        if (User.Identity?.IsAuthenticated == true)
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(raw, out var uid))
                userId = uid;
            userName = User.FindFirstValue(ClaimTypes.Name)
                    ?? User.FindFirstValue(ClaimTypes.GivenName);
        }

        Guid?  cityId   = null;
        string cityName = "your city";

        var cityIdHeader = Request.Headers["X-City-Id"].FirstOrDefault();
        var cityNameHeader = Request.Headers["X-City-Name"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(cityIdHeader) && Guid.TryParse(cityIdHeader, out var cid))
            cityId = cid;
        if (!string.IsNullOrWhiteSpace(cityNameHeader))
            cityName = cityNameHeader;

        var result = await _chatbot.ProcessMessageAsync(request, userId, cityId, cityName, userName, ct);
        return Ok(result);
    }
}
