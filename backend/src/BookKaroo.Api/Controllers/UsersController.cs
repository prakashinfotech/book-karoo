using System.Security.Claims;
using BCrypt.Net;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

namespace BookKaroo.Api.Controllers;

[ApiController]
[Route("api/users")]
[Produces("application/json")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserRepository    _users;
    private readonly IServiceScopeFactory _scopeFactory;

    public UsersController(IUserRepository users, IServiceScopeFactory scopeFactory)
    {
        _users        = users;
        _scopeFactory = scopeFactory;
    }

    /// <summary>Update the authenticated user's profile.</summary>
    [HttpPut("me")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _users.GetByIdAsync(userId, ct);
        if (user == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Name))   user.Name   = request.Name.Trim();
        if (!string.IsNullOrWhiteSpace(request.Mobile)) user.Mobile = request.Mobile.Trim();
        if (request.Gender  != null) user.Gender  = request.Gender;
        if (request.CityId  != null) user.CityId  = request.CityId == "" ? null : Guid.TryParse(request.CityId, out var cid) ? cid : user.CityId;

        await _users.UpdateAsync(user, ct);

        return Ok(new
        {
            user.Id,
            user.Email,
            user.Mobile,
            user.Name,
            user.Gender,
            user.Dob,
            user.CityId,
            user.Role,
            user.EmailVerified,
            user.ProfilePicUrl,
            user.StateCode,
            user.PasswordChangedAt,
        });
    }

    /// <summary>Change the authenticated user's password.</summary>
    [HttpPatch("me/password")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _users.GetByIdAsync(userId, ct);
        if (user == null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Current password is incorrect." });

        if (request.NewPassword.Length < 8)
            return BadRequest(new { message = "New password must be at least 8 characters." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, workFactor: 12);
        user.PasswordChangedAt = DateTime.UtcNow;
        await _users.UpdateAsync(user, ct);

        return Ok(new { message = "Password updated successfully." });
    }

    /// <summary>Soft-delete (deactivate) the authenticated user's account and notify via email.</summary>
    [HttpDelete("me")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> DeleteMe(CancellationToken ct)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user   = await _users.GetByIdAsync(userId, ct);
        if (user == null) return NotFound();

        user.DeletedAt = DateTime.UtcNow;
        user.RefreshToken = null;
        user.RefreshTokenExpiresAt = null;
        await _users.UpdateAsync(user, ct);

        var capturedName  = user.Name;
        var capturedEmail = user.Email;
        _ = Task.Run(async () =>
        {
            await using var scope = _scopeFactory.CreateAsyncScope();
            var email = scope.ServiceProvider.GetRequiredService<IEmailService>();
            await email.SendAccountDeletedAsync(
                new BookKaroo.Domain.Entities.User { Name = capturedName, Email = capturedEmail },
                CancellationToken.None);
        });

        return Ok(new { message = "Your account has been deactivated. We're sorry to see you go." });
    }
}

public record UpdateProfileRequest(string? Name, string? Mobile, string? Gender, string? CityId);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
