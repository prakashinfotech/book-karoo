namespace BookKaroo.Application.DTOs.Payment;

public record CreateOrderRequest(
    Guid     ShowId,
    string[] Seats,
    string   IdempotencyKey,
    string?  CouponCode = null
);
