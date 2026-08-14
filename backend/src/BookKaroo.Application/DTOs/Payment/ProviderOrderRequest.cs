namespace BookKaroo.Application.DTOs.Payment;

/// <summary>Low-level payment provider order request (Razorpay / Mock).</summary>
public record ProviderOrderRequest(
    decimal Amount,
    string  Currency = "INR"
);
