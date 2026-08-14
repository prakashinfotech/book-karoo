namespace BookKaroo.Application.DTOs.Payment;

public record PaymentCapture(
    string ProviderOrderId,
    string? ProviderPaymentId,
    bool Success,
    string? Error
);
