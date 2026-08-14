using BookKaroo.Application.DTOs.Coupon;

namespace BookKaroo.Application.Interfaces.Services;

public interface ICouponService
{
    Task<CouponValidationResponse> ValidateAsync(
        string  code,
        Guid    showId,
        Guid?   userId,
        decimal ticketAmount,
        CancellationToken ct = default);
}
