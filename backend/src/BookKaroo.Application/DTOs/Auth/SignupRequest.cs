namespace BookKaroo.Application.DTOs.Auth;

public record SignupRequest(
    string Email,
    string Password,
    string Name,
    string Mobile,
    string? Gender,
    DateOnly? Dob,
    Guid? CityId
);
