namespace BookKaroo.Application.DTOs.Pricing;

public record PricingBreakdown(
    decimal TicketAmount,
    decimal ConvenienceFee,
    decimal ConvenienceFeeGst,
    decimal OfferProcessingFee,
    decimal OfferProcessingFeeGst,
    decimal TaxableAmount,
    decimal Cgst,
    decimal Sgst,
    decimal Igst,
    decimal Discount,
    decimal AmountPaid,
    bool IsIntraState
);
