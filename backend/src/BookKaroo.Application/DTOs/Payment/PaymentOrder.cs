namespace BookKaroo.Application.DTOs.Payment;

public record PaymentOrder(
    string OrderId,
    string Provider,
    string ProviderOrderId,
    decimal Amount,
    string Currency,
    string? CheckoutUrl,
    string? ProviderKey,
    string? RazorpayKeyId = null
);
