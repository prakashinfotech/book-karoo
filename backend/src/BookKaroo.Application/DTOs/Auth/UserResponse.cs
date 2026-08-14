using BookKaroo.Domain.Enums;

namespace BookKaroo.Application.DTOs.Auth;

public record UserResponse(
    Guid Id,
    string Email,
    string Mobile,
    string Name,
    UserRole Role,
    bool EmailVerified,
    Guid? CityId,
    string? StateCode,
    string? ProfilePicUrl,
    string? Gender,
    DateOnly? Dob,
    DateTime? PasswordChangedAt,
    bool IsPartner = false,
    List<Guid>? PartnerVenueIds = null,
    List<string>? PartnerVenueNames = null
);
