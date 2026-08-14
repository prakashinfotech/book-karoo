using BookKaroo.Domain.Enums;

namespace BookKaroo.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateOnly? Dob { get; set; }
    public string? Gender { get; set; }
    public Guid? CityId { get; set; }
    public string? StateCode { get; set; }
    public string? ProfilePicUrl { get; set; }
    public UserRole Role { get; set; } = UserRole.User;
    public bool EmailVerified { get; set; }
    public bool IsBlocked { get; set; }
    public string? Preferences { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }
    public DateTime? PasswordChangedAt { get; set; }
}
