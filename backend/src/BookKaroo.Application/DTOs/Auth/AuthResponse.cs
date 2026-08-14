namespace BookKaroo.Application.DTOs.Auth;

public record AuthResponse(string AccessToken, string RefreshToken, UserResponse User);
