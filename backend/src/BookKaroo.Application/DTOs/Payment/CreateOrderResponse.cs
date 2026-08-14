using BookKaroo.Application.DTOs.Pricing;

namespace BookKaroo.Application.DTOs.Payment;

public record CreateOrderResponse(
    Guid             OrderId,
    string           BookingRef,
    string           ProviderOrderId,
    string           Provider,
    decimal          Amount,
    string           Currency,
    PricingBreakdown Breakdown,
    string?          RazorpayKeyId = null
);
