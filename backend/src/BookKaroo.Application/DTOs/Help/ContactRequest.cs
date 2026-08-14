namespace BookKaroo.Application.DTOs.Help;

public record ContactRequest(
    string Name,
    string Email,
    string Subject,
    string Message,
    string? BookingRef
);
