using BookKaroo.Domain.Enums;

namespace BookKaroo.Domain.Entities;

public class Coupon : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public CouponType Type { get; set; }
    public decimal Value { get; set; }
    public decimal? MaxDiscount { get; set; }
    public decimal MinOrder { get; set; }
    public DateTime ValidFrom { get; set; }
    public DateTime ValidTo { get; set; }
    public int UsageLimitPerUser { get; set; } = 1;
    public int? TotalUsageLimit { get; set; }
    public int CurrentUsage { get; set; }
    public Guid[] ApplicableCities { get; set; } = [];
    public Guid[] ApplicableMovies { get; set; } = [];
    public Guid[] ApplicableVenues { get; set; } = [];
    public bool IsActive { get; set; } = true;
}
