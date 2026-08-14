using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Services;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Moq;

namespace BookKaroo.Tests;

public class PricingServiceTests
{
    private static PricingService CreateService(Dictionary<string, string>? overrides = null)
    {
        var defaults = new Dictionary<string, string>
        {
            ["convenience_fee_per_ticket"] = "59.00",
            ["offer_processing_fee"] = "15.00",
            ["company_state_code"] = "24"
        };

        if (overrides != null)
            foreach (var kv in overrides)
                defaults[kv.Key] = kv.Value;

        var repo = new Mock<ISettingRepository>();
        repo.Setup(r => r.GetAllAsync(default)).ReturnsAsync(defaults);
        var cache = new MemoryCache(new MemoryCacheOptions());
        return new PricingService(repo.Object, cache);
    }

    [Fact]
    public async Task Calculate_IntraState_ReturnsCgstAndSgst()
    {
        var svc = CreateService();
        var result = await svc.CalculateAsync(2, 300m, "24", null);

        result.IsIntraState.Should().BeTrue();
        result.ConvenienceFee.Should().Be(118m);   // 2 × 59
        result.Cgst.Should().Be(10.62m);            // 118 × 0.09
        result.Sgst.Should().Be(10.62m);
        result.Igst.Should().Be(0m);
        result.OfferProcessingFee.Should().Be(0m);
    }

    [Fact]
    public async Task Calculate_InterState_ReturnsIgst()
    {
        var svc = CreateService();
        var result = await svc.CalculateAsync(1, 200m, "27", null); // Maharashtra ≠ Gujarat

        result.IsIntraState.Should().BeFalse();
        result.Cgst.Should().Be(0m);
        result.Sgst.Should().Be(0m);
        result.Igst.Should().Be(10.62m); // 59 × 0.18
    }

    [Fact]
    public async Task Calculate_WithFlatCoupon_AppliesDiscount()
    {
        var svc = CreateService();
        var coupon = new Coupon { Type = CouponType.Flat, Value = 100m };

        var result = await svc.CalculateAsync(2, 300m, "24", coupon);

        result.Discount.Should().Be(100m);
        result.OfferProcessingFee.Should().Be(15m);
    }

    [Fact]
    public async Task Calculate_WithPercentCoupon_AppliesDiscountWithCap()
    {
        var svc = CreateService();
        // 20% on ₹600 = ₹120; but capped at ₹80
        var coupon = new Coupon { Type = CouponType.Percent, Value = 20m, MaxDiscount = 80m };

        var result = await svc.CalculateAsync(2, 300m, "24", coupon);

        result.Discount.Should().Be(80m);
    }

    [Fact]
    public async Task Calculate_WithCoupon_IncludesOfferProcessingFee()
    {
        var svc = CreateService();
        var coupon = new Coupon { Type = CouponType.Flat, Value = 50m };

        var result = await svc.CalculateAsync(1, 200m, "24", coupon);

        result.OfferProcessingFee.Should().Be(15m);
        result.OfferProcessingFeeGst.Should().BeApproximately(2.70m, 0.01m);
    }

    [Fact]
    public async Task Calculate_WithoutCoupon_NoOfferProcessingFee()
    {
        var svc = CreateService();
        var result = await svc.CalculateAsync(1, 200m, "24", null);

        result.OfferProcessingFee.Should().Be(0m);
        result.OfferProcessingFeeGst.Should().Be(0m);
    }

    [Fact]
    public async Task Calculate_RoundsToTwoDecimalPlaces()
    {
        var svc = CreateService();
        // 1 ticket × ₹59 conv fee; GST 9% = ₹5.31 (not ₹5.3100...)
        var result = await svc.CalculateAsync(1, 100m, "24", null);

        result.Cgst.Should().Be(5.31m);
        result.Sgst.Should().Be(5.31m);
        (result.Cgst % 0.01m).Should().Be(0m); // exactly 2 d.p.
    }
}
