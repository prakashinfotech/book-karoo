using System.Security.Claims;
using BookKaroo.Application.DTOs.Auth;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    private readonly IWebHostEnvironment _env;
    private const string RefreshTokenCookie = "bk_refresh";

    public AuthController(IAuthService auth, IWebHostEnvironment env)
    {
        _auth = auth;
        _env  = env;
    }

    /// <summary>Register a new user account.</summary>
    [HttpPost("signup")]
    [ProducesResponseType(typeof(AuthResponse), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> Signup([FromBody] SignupRequest request, CancellationToken ct)
    {
        var result = await _auth.SignupAsync(request, ct);
        SetRefreshCookie(result.RefreshToken);
        return StatusCode(201, new { result.AccessToken, result.User });
    }

    /// <summary>Login with email/mobile and password.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), 200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await _auth.LoginAsync(request, ct);
        SetRefreshCookie(result.RefreshToken);
        return Ok(new { result.AccessToken, result.User });
    }

    /// <summary>Obtain a new access token using the httpOnly refresh cookie.</summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Refresh(CancellationToken ct)
    {
        var refreshToken = Request.Cookies[RefreshTokenCookie];
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(new { message = "No refresh token." });

        var result = await _auth.RefreshAsync(refreshToken, ct);
        SetRefreshCookie(result.RefreshToken);
        return Ok(new { result.AccessToken, result.User });
    }

    /// <summary>Logout — clears refresh token cookie and invalidates server-side token.</summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(204)]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        var userId = GetUserId();
        if (userId.HasValue)
            await _auth.LogoutAsync(userId.Value, ct);

        Response.Cookies.Delete(RefreshTokenCookie);
        return NoContent();
    }

    /// <summary>Send a password reset email (always returns 200 to prevent enumeration).</summary>
    [HttpPost("forgot-password")]
    [ProducesResponseType(200)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken ct)
    {
        await _auth.ForgotPasswordAsync(request, ct);
        return Ok(new { message = "If an account exists, a reset link has been sent." });
    }

    /// <summary>Reset password using a token from the reset email.</summary>
    [HttpPost("reset-password")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        await _auth.ResetPasswordAsync(request, ct);
        return Ok(new { message = "Password reset successfully." });
    }

    /// <summary>Get the currently authenticated user's profile.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserResponse), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> GetMe(CancellationToken ct)
    {
        var userId = GetUserId() ?? throw new Application.Exceptions.UnauthorizedException("Invalid token.");
        var user = await _auth.GetMeAsync(userId, ct);
        return Ok(user);
    }

    private void SetRefreshCookie(string token)
    {
        Response.Cookies.Append(RefreshTokenCookie, token, new CookieOptions
        {
            HttpOnly = true,
            // Secure must be false in dev (HTTP localhost); true in production (HTTPS).
            // Without this, the browser silently drops the cookie on HTTP.
            Secure   = !_env.IsDevelopment(),
            SameSite = SameSiteMode.Lax, // Lax allows cross-port localhost requests
            Expires  = DateTimeOffset.UtcNow.AddDays(30)
        });
    }

    private Guid? GetUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub");
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}
