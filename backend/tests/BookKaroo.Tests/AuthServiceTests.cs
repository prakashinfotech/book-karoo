using BookKaroo.Application.DTOs.Auth;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Application.Services;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace BookKaroo.Tests;

public class AuthServiceTests
{
    private static AuthService CreateService(
        Mock<IUserRepository>? userRepo = null,
        Mock<IPasswordResetTokenRepository>? tokenRepo = null,
        Mock<IEmailService>? email = null)
    {
        userRepo ??= new Mock<IUserRepository>();
        tokenRepo ??= new Mock<IPasswordResetTokenRepository>();
        email ??= new Mock<IEmailService>();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JWT_SECRET"]           = "test-super-secret-key-that-is-at-least-256-bits-long-for-hmac",
                ["JWT_ISSUER"]           = "bookkaroo-test",
                ["JWT_AUDIENCE"]         = "bookkaroo-api-test",
                ["JWT_ACCESS_TTL_MIN"]   = "15",
                ["JWT_REFRESH_TTL_DAYS"] = "30"
            })
            .Build();

        var scopeFactory = new Mock<Microsoft.Extensions.DependencyInjection.IServiceScopeFactory>();
        var logger       = new Mock<ILogger<AuthService>>();
        var partners     = new Mock<IPartnerRepository>();
        var venues       = new Mock<IVenueRepository>();
        return new AuthService(userRepo.Object, tokenRepo.Object, email.Object, config, scopeFactory.Object, logger.Object, partners.Object, venues.Object);
    }

    // ── Signup ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task SignupAsync_ValidInput_CreatesUserAndSendsEmail()
    {
        var userRepo = new Mock<IUserRepository>();
        var email = new Mock<IEmailService>();

        userRepo.Setup(r => r.FindByEmailAsync("new@test.com", default))
                .ReturnsAsync((User?)null);
        userRepo.Setup(r => r.AddAsync(It.IsAny<User>(), default)).Returns(Task.CompletedTask);
        userRepo.Setup(r => r.UpdateAsync(It.IsAny<User>(), default)).Returns(Task.CompletedTask);
        email.Setup(e => e.SendWelcomeAsync(It.IsAny<User>(), default)).Returns(Task.CompletedTask);

        var svc = CreateService(userRepo, email: email);
        var request = new SignupRequest("new@test.com", "Str0ng!Pass", "Test User", "+919876543210", null, null, null);

        var result = await svc.SignupAsync(request);

        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.User.Email.Should().Be("new@test.com");
        userRepo.Verify(r => r.AddAsync(It.IsAny<User>(), default), Times.Once);
    }

    [Fact]
    public async Task SignupAsync_DuplicateEmail_ThrowsConflictException()
    {
        var userRepo = new Mock<IUserRepository>();
        userRepo.Setup(r => r.FindByEmailAsync("existing@test.com", default))
                .ReturnsAsync(new User { Email = "existing@test.com" });

        var svc = CreateService(userRepo);
        var request = new SignupRequest("existing@test.com", "Str0ng!Pass", "Name", "+919876543210", null, null, null);

        await svc.Invoking(s => s.SignupAsync(request))
                 .Should().ThrowAsync<ConflictException>();
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task LoginAsync_ValidCredentials_ReturnsTokens()
    {
        var hash = BCrypt.Net.BCrypt.HashPassword("Str0ng!Pass", workFactor: 4);
        var user = new User { Id = Guid.NewGuid(), Email = "user@test.com", PasswordHash = hash, Role = UserRole.User };

        var userRepo = new Mock<IUserRepository>();
        userRepo.Setup(r => r.FindByEmailAsync("user@test.com", default)).ReturnsAsync(user);
        userRepo.Setup(r => r.UpdateAsync(It.IsAny<User>(), default)).Returns(Task.CompletedTask);

        var svc = CreateService(userRepo);
        var result = await svc.LoginAsync(new LoginRequest("user@test.com", "Str0ng!Pass"));

        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task LoginAsync_WrongPassword_ThrowsUnauthorizedException()
    {
        var hash = BCrypt.Net.BCrypt.HashPassword("CorrectPass1!", workFactor: 4);
        var user = new User { Id = Guid.NewGuid(), Email = "user@test.com", PasswordHash = hash };

        var userRepo = new Mock<IUserRepository>();
        userRepo.Setup(r => r.FindByEmailAsync("user@test.com", default)).ReturnsAsync(user);

        var svc = CreateService(userRepo);

        await svc.Invoking(s => s.LoginAsync(new LoginRequest("user@test.com", "WrongPass!")))
                 .Should().ThrowAsync<UnauthorizedException>();
    }

    [Fact]
    public async Task LoginAsync_BlockedUser_ThrowsForbiddenException()
    {
        var hash = BCrypt.Net.BCrypt.HashPassword("Str0ng!Pass", workFactor: 4);
        var user = new User { Id = Guid.NewGuid(), Email = "blocked@test.com", PasswordHash = hash, IsBlocked = true };

        var userRepo = new Mock<IUserRepository>();
        userRepo.Setup(r => r.FindByEmailAsync("blocked@test.com", default)).ReturnsAsync(user);

        var svc = CreateService(userRepo);

        await svc.Invoking(s => s.LoginAsync(new LoginRequest("blocked@test.com", "Str0ng!Pass")))
                 .Should().ThrowAsync<ForbiddenException>();
    }

    // ── Refresh ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task RefreshAsync_ValidToken_RotatesToken()
    {
        const string rawToken = "valid-refresh-token-abc";
        var tokenHash = BCrypt.Net.BCrypt.HashPassword(rawToken, workFactor: 4);
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@test.com",
            Role = UserRole.User,
            PasswordHash = "ph",
            RefreshToken = tokenHash,
            RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(10)
        };

        var userRepo = new Mock<IUserRepository>();
        userRepo.Setup(r => r.FindByRefreshTokenAsync(rawToken, default)).ReturnsAsync(user);
        userRepo.Setup(r => r.UpdateAsync(It.IsAny<User>(), default)).Returns(Task.CompletedTask);

        var svc = CreateService(userRepo);
        var result = await svc.RefreshAsync(rawToken);

        result.AccessToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBe(rawToken); // token was rotated
        userRepo.Verify(r => r.UpdateAsync(It.Is<User>(u =>
            u.RefreshToken != tokenHash), default), Times.Once);
    }

    [Fact]
    public async Task RefreshAsync_ExpiredToken_ThrowsUnauthorizedException()
    {
        var userRepo = new Mock<IUserRepository>();
        // FindByRefreshTokenAsync internally checks expiry; returns null for expired
        userRepo.Setup(r => r.FindByRefreshTokenAsync(It.IsAny<string>(), default))
                .ReturnsAsync((User?)null);

        var svc = CreateService(userRepo);

        await svc.Invoking(s => s.RefreshAsync("expired-token"))
                 .Should().ThrowAsync<UnauthorizedException>();
    }
}
