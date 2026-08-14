using BookKaroo.Application.DTOs.Auth;

namespace BookKaroo.Application.Interfaces.Services;

public interface IAuthService
{
    Task<AuthResponse> SignupAsync(SignupRequest request, CancellationToken ct = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<AuthResponse> RefreshAsync(string refreshToken, CancellationToken ct = default);
    Task LogoutAsync(Guid userId, CancellationToken ct = default);
    Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct = default);
    Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default);
    Task<UserResponse> GetMeAsync(Guid userId, CancellationToken ct = default);
}
