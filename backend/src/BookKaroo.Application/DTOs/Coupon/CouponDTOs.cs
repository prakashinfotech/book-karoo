namespace BookKaroo.Application.DTOs.Coupon;

public record ValidateCouponRequest(
    string  Code,
    Guid    ShowId,
    Guid?   UserId,
    decimal TicketAmount
);

public record CouponValidationResponse(
    bool    Valid,
    Guid    CouponId,
    string  Code,
    decimal Discount,
    string  Description
);
