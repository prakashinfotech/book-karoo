namespace BookKaroo.Domain.Entities;

public class CouponUsage : BaseEntity
{
    public Guid CouponId { get; set; }
    public Guid UserId { get; set; }
    public Guid BookingId { get; set; }
}
