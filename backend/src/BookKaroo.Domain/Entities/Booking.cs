using BookKaroo.Domain.Enums;

namespace BookKaroo.Domain.Entities;

public class Booking : BaseEntity
{
    public string BookingRef { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public Guid? ShowId { get; set; }
    public int TicketQty { get; set; }
    public decimal TicketAmount { get; set; }
    public decimal ConvenienceFee { get; set; }
    public decimal OfferProcessingFee { get; set; }
    public decimal TaxableAmount { get; set; }
    public decimal Cgst { get; set; }
    public decimal Sgst { get; set; }
    public decimal Igst { get; set; }
    public decimal Discount { get; set; }
    public decimal AmountPaid { get; set; }
    public string CustomerStateCode { get; set; } = string.Empty;
    public Guid? CouponId { get; set; }
    public Guid? EventId  { get; set; }
    public string? TierName { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public string? InvoiceNumber { get; set; }
    public string? InvoiceUrl { get; set; }
    public string? QrUrl { get; set; }
    public string? PaymentMethodLabel { get; set; }
    public DateTime? CancelledAt    { get; set; }
    public Guid?    LysEventId       { get; set; }
    public decimal  CommissionAmount { get; set; }
    public decimal  CommissionRate   { get; set; }
}
