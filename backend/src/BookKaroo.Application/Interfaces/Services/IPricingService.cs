using BookKaroo.Application.DTOs.Pricing;
using BookKaroo.Domain.Entities;

namespace BookKaroo.Application.Interfaces.Services;

public interface IPricingService
{
    Task<PricingBreakdown> CalculateAsync(
        int qty,
        decimal seatPrice,
        string customerStateCode,
        Coupon? coupon,
        CancellationToken ct = default);
}
