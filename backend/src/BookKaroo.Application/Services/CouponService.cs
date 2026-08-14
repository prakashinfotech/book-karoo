using BookKaroo.Application.DTOs.Coupon;
using BookKaroo.Application.Exceptions;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Application.Interfaces.Services;
using BookKaroo.Domain.Entities;
using BookKaroo.Domain.Enums;

namespace BookKaroo.Application.Services;

public class CouponService : ICouponService
{
    private readonly ICouponRepository         _coupons;
    private readonly IShowRepository           _shows;
    private readonly IRepository<Venue>        _venues;

    public CouponService(
        ICouponRepository    coupons,
        IShowRepository      shows,
        IRepository<Venue>   venues)
    {
        _coupons = coupons;
        _shows   = shows;
        _venues  = venues;
    }

    public async Task<CouponValidationResponse> ValidateAsync(
        string code, Guid showId, Guid? userId, decimal ticketAmount,
        CancellationToken ct = default)
    {
        var coupon = await _coupons.FindByCodeAsync(code.ToUpperInvariant(), ct)
            ?? throw new NotFoundException("Invalid coupon code.");

        if (!coupon.IsActive)
            throw new AppException("Coupon is inactive.", 400);

        var now = DateTime.UtcNow;
        if (coupon.ValidFrom > now)
            throw new AppException("Coupon not yet active.", 400);
        if (coupon.ValidTo < now)
            throw new AppException("Coupon has expired.", 400);
        if (ticketAmount < coupon.MinOrder)
            throw new AppException($"Minimum order ₹{coupon.MinOrder} required for this coupon.", 400);
        if (coupon.TotalUsageLimit.HasValue && coupon.CurrentUsage >= coupon.TotalUsageLimit.Value)
            throw new AppException("Coupon usage limit reached.", 400);

        if (coupon.ApplicableCities.Length > 0 || coupon.ApplicableMovies.Length > 0)
        {
            var show = await _shows.GetByIdAsync(showId, ct)
                ?? throw new NotFoundException($"Show {showId} not found.");

            if (coupon.ApplicableCities.Length > 0)
            {
                var allVenues = await _venues.GetAllAsync(ct);
                var venue = allVenues.FirstOrDefault(v => v.Id == show.VenueId);
                if (venue == null || !coupon.ApplicableCities.Contains(venue.CityId))
                    throw new AppException("Coupon not valid in your city.", 400);
            }

            if (coupon.ApplicableMovies.Length > 0 && show.MovieId.HasValue)
            {
                if (!coupon.ApplicableMovies.Contains(show.MovieId.Value))
                    throw new AppException("Coupon not valid for this movie.", 400);
            }
        }

        var discount = CalculateDiscount(coupon, ticketAmount);

        return new CouponValidationResponse(
            Valid:       true,
            CouponId:    coupon.Id,
            Code:        coupon.Code,
            Discount:    discount,
            Description: coupon.Description ?? $"{coupon.Code} applied");
    }

    private static decimal CalculateDiscount(Coupon coupon, decimal ticketAmount)
    {
        decimal discount = coupon.Type switch
        {
            CouponType.Flat    => coupon.Value,
            CouponType.Percent => coupon.MaxDiscount.HasValue
                ? Math.Min(coupon.MaxDiscount.Value, Round(ticketAmount * coupon.Value / 100m))
                : Round(ticketAmount * coupon.Value / 100m),
            _ => 0m
        };
        return Round(Math.Max(0m, discount));
    }

    private static decimal Round(decimal v) =>
        Math.Round(v, 2, MidpointRounding.AwayFromZero);
}
