using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BookKaroo.Application.DTOs.Auth;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace BookKaroo.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _users;
    private readonly IPasswordResetTokenRepository _resetTokens;
    private readonly IEmailService _email;
    private readonly IConfiguration _config;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AuthService> _logger;
    private readonly IPartnerRepository _partners;
    private readonly IVenueRepository _venues;

    public AuthService(
        IUserRepository users,
        IPasswordResetTokenRepository resetTokens,
        IEmailService email,
        IConfiguration config,
        IServiceScopeFactory scopeFactory,
        ILogger<AuthService> logger,
        IPartnerRepository partners,
        IVenueRepository venues)
    {
        _users        = users;
        _resetTokens  = resetTokens;
        _email        = email;
        _config       = config;
        _scopeFactory = scopeFactory;
        _logger       = logger;
        _partners     = partners;
        _venues       = venues;
    }

    public async Task<AuthResponse> SignupAsync(SignupRequest request, CancellationToken ct = default)
    {
        var existing = await _users.FindByEmailAsync(request.Email, ct);
        if (existing != null)
            throw new ConflictException("An account with this email already exists.");

        var user = new User
        {
            Email = request.Email.ToLowerInvariant(),
            Mobile = request.Mobile,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12),
            Name = request.Name,
            Gender = request.Gender,
            Dob = request.Dob,
            CityId = request.CityId,
            Role = UserRole.User,
            EmailVerified = false
        };

        await _users.AddAsync(user, ct);

        // Use a fresh scope so the scoped IEmailService isn't disposed when the request ends
        var capturedName  = user.Name;
        var capturedEmail = user.Email;
        _ = Task.Run(async () =>
        {
            try
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var email = scope.ServiceProvider.GetRequiredService<IEmailService>();
                await email.SendWelcomeAsync(
                    new User { Name = capturedName, Email = capturedEmail },
                    CancellationToken.None);
                _logger.LogInformation("Welcome email sent to {Email}", capturedEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send welcome email to {Email}", capturedEmail);
            }
        });

        var (accessToken, refreshToken) = GenerateTokens(user);
        user.RefreshToken = BCrypt.Net.BCrypt.HashPassword(refreshToken, workFactor: 4);
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(GetRefreshTtlDays());
        await _users.UpdateAsync(user, ct);

        return new AuthResponse(accessToken, refreshToken, MapUser(user));
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        User? user;
        if (request.Identifier.Contains('@'))
            user = await _users.FindByEmailAsync(request.Identifier.ToLowerInvariant(), ct);
        else
            user = await _users.FindByMobileAsync(request.Identifier, ct);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedException("Invalid credentials.");

        if (user.IsBlocked)
            throw new ForbiddenException("Your account has been blocked. Please contact support.");

        var (accessToken, refreshToken) = GenerateTokens(user);
        user.RefreshToken = BCrypt.Net.BCrypt.HashPassword(refreshToken, workFactor: 4);
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(GetRefreshTtlDays());
        await _users.UpdateAsync(user, ct);

        return new AuthResponse(accessToken, refreshToken, MapUser(user));
    }

    public async Task<AuthResponse> RefreshAsync(string refreshToken, CancellationToken ct = default)
    {
        // Find users whose token hash might match (we store hash, so we search all with non-null token)
        var user = await _users.FindByRefreshTokenAsync(refreshToken, ct);
        if (user == null)
            throw new UnauthorizedException("Invalid refresh token.");

        if (user.RefreshTokenExpiresAt < DateTime.UtcNow)
            throw new UnauthorizedException("Refresh token has expired. Please sign in again.");

        var (accessToken, newRefreshToken) = GenerateTokens(user);
        user.RefreshToken = BCrypt.Net.BCrypt.HashPassword(newRefreshToken, workFactor: 4);
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(GetRefreshTtlDays());
        await _users.UpdateAsync(user, ct);

        return new AuthResponse(accessToken, newRefreshToken, MapUser(user));
    }

    public async Task LogoutAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _users.GetByIdAsync(userId, ct);
        if (user == null) return;
        user.RefreshToken = null;
        user.RefreshTokenExpiresAt = null;
        await _users.UpdateAsync(user, ct);
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct = default)
    {
        // Always return 200 to prevent email enumeration
        var user = await _users.FindByEmailAsync(request.Email.ToLowerInvariant(), ct);
        if (user == null) return;

        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

        var resetToken = new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        };
        await _resetTokens.AddAsync(resetToken, ct);

        _ = Task.Run(() => _email.SendPasswordResetAsync(user, rawToken, ct), ct);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default)
    {
        var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(request.Token)));
        var resetToken = await _resetTokens.FindValidAsync(tokenHash, ct);
        if (resetToken == null)
            throw new AppException("Token is invalid or has expired.", 400);

        var user = await _users.GetByIdAsync(resetToken.UserId, ct);
        if (user == null) throw new NotFoundException("User not found.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, workFactor: 12);
        user.PasswordChangedAt = DateTime.UtcNow;
        user.RefreshToken = null;
        user.RefreshTokenExpiresAt = null;
        await _users.UpdateAsync(user, ct);
        await _resetTokens.MarkUsedAsync(resetToken.Id, ct);
    }

    public async Task<UserResponse> GetMeAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _users.GetByIdAsync(userId, ct)
            ?? throw new NotFoundException("User not found.");

        if (user.Role == UserRole.Partner)
        {
            var profile = await _partners.GetByUserIdAsync(userId, ct);
            if (profile != null)
            {
                var venueIds   = await _partners.GetVenueIdsAsync(profile.Id, ct);
                var namesMap   = await _venues.GetNamesByIdsAsync(venueIds, ct);
                var venueNames = venueIds.Select(id => namesMap.TryGetValue(id, out var n) ? n : id.ToString()).ToList();
                return MapUser(user, isPartner: true, partnerVenueIds: venueIds, partnerVenueNames: venueNames);
            }
        }

        return MapUser(user);
    }

    private (string AccessToken, string RefreshToken) GenerateTokens(User user)
    {
        var secret = _config["JWT_SECRET"] ?? throw new InvalidOperationException("JWT_SECRET not configured.");
        var issuer = _config["JWT_ISSUER"] ?? "bookkaroo";
        var audience = _config["JWT_AUDIENCE"] ?? "bookkaroo-api";
        var ttlMin = int.TryParse(_config["JWT_ACCESS_TTL_MIN"], out var m) ? m : 15;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(ttlMin),
            signingCredentials: creds);

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);
        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        return (accessToken, refreshToken);
    }

    private int GetRefreshTtlDays() =>
        int.TryParse(_config["JWT_REFRESH_TTL_DAYS"], out var d) ? d : 30;

    private static UserResponse MapUser(
        User u,
        bool isPartner = false,
        List<Guid>? partnerVenueIds = null,
        List<string>? partnerVenueNames = null) => new(
        u.Id, u.Email, u.Mobile, u.Name, u.Role, u.EmailVerified,
        u.CityId, u.StateCode, u.ProfilePicUrl, u.Gender, u.Dob, u.PasswordChangedAt,
        isPartner, partnerVenueIds, partnerVenueNames);
}
