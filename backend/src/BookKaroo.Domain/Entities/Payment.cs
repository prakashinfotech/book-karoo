using BookKaroo.Domain.Enums;

namespace BookKaroo.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid BookingId { get; set; }
    public PaymentProvider Provider { get; set; } = PaymentProvider.Mock;
    public string? ProviderOrderId { get; set; }
    public string? ProviderPaymentId { get; set; }
    public string? ProviderSignature { get; set; }
    public string? ProviderPayload { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string? Method { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Created;
    public string? IdempotencyKey { get; set; }
    public string? RefundId { get; set; }
    public decimal? RefundAmount { get; set; }
    public DateTime? CapturedAt { get; set; }
}
