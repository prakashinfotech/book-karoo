namespace BookKaroo.Application.DTOs.Invoice;

public record InvoiceModel(
    string InvoiceNumber,
    DateTime IssuedAt,
    string PlaceOfSupply,
    string BookingRef,
    string CustomerName,
    string CustomerEmail,
    string CustomerStateCode,
    string? CustomerGstin,
    InvoiceLine[] Lines,
    GstSummary Gst,
    string AmountInWords,
    string VenueNoteText,
    string PaymentTransactionId,
    decimal PaymentTotal,
    DateTime PaymentDateTime,
    string PaymentMethod,
    string CompanyName,
    string CompanyGstin,
    string CompanyPan,
    string CompanyStateCode,
    string CompanyAddress,
    // Full payment summary fields (for the "Amount Paid" summary block)
    int     TicketQty,
    decimal TicketAmount,
    decimal ConvenienceFee,
    decimal ConvenienceFeeGst,
    decimal OfferProcessingFee,
    decimal OfferProcessingFeeGst,
    decimal Discount,
    decimal AmountPaid
);

public record InvoiceLine(
    string Description,
    string SacCode,
    int Qty,
    decimal Price,
    decimal Discount,
    decimal TaxableAmount,
    decimal CgstRate, decimal CgstAmount,
    decimal SgstRate, decimal SgstAmount,
    decimal IgstRate, decimal IgstAmount,
    decimal CessRate, decimal CessAmount,
    decimal Total
);

public record GstSummary(
    decimal TotalBeforeTax,
    decimal Cgst,
    decimal Sgst,
    decimal Igst,
    decimal UgstCess,
    decimal TotalGst,
    decimal TotalAfterTax
);
