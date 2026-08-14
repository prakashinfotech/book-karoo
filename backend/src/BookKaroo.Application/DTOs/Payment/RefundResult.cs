namespace BookKaroo.Application.DTOs.Payment;

public record RefundResult(bool Success, string? RefundId, string? Error);
