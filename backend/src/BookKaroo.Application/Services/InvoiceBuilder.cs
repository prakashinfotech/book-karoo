using BookKaroo.Application.DTOs.Invoice;
using BookKaroo.Application.Interfaces.Repositories;
using BookKaroo.Domain.Entities;

namespace BookKaroo.Application.Services;

public class InvoiceBuilder
{
    private readonly ISettingRepository _settings;

    public InvoiceBuilder(ISettingRepository settings)
    {
        _settings = settings;
    }

    public async Task<InvoiceModel> BuildAsync(
        Booking booking, Show? show, Movie? movie, Venue? venue, Payment? payment,
        User user, CancellationToken ct = default,
        string? eventTitle = null, DateTime? eventDate = null)
    {
        var allSettings     = await _settings.GetAllAsync(ct);
        var companyStateCode = allSettings.GetValueOrDefault("company_state_code", "24");
        bool isIntraState   = user.StateCode == companyStateCode;

        decimal cgstRate = isIntraState ? 0.09m : 0m;
        decimal sgstRate = isIntraState ? 0.09m : 0m;
        decimal igstRate = isIntraState ? 0m : 0.18m;

        string companyName    = allSettings.GetValueOrDefault("company_name", "BookKaroo Pvt Ltd");
        string companyGstin   = allSettings.GetValueOrDefault("company_gstin", "24XXXXX0000X1Z5");
        string companyPan     = allSettings.GetValueOrDefault("company_pan", "XXXXX0000X");
        string companyState   = allSettings.GetValueOrDefault("company_state_name", "Gujarat");
        string companyAddress = allSettings.GetValueOrDefault("company_address_line1", "701, Demo Tower, SG Highway") + ", "
                              + allSettings.GetValueOrDefault("company_address_line2", "Bodakdev") + ", "
                              + allSettings.GetValueOrDefault("company_city", "Ahmedabad") + " "
                              + allSettings.GetValueOrDefault("company_pincode", "380054");

        var lines = new List<InvoiceLine>();

        // Line 1: Convenience Fee (always present)
        decimal convTaxable  = booking.ConvenienceFee;
        decimal convCgst     = Math.Round(convTaxable * cgstRate, 2);
        decimal convSgst     = Math.Round(convTaxable * sgstRate, 2);
        decimal convIgst     = Math.Round(convTaxable * igstRate, 2);
        decimal convFeePerTk = booking.TicketQty > 0 ? Math.Round(convTaxable / booking.TicketQty, 2) : 59m;

        bool isEventBooking = booking.EventId.HasValue;
        var movieTitle  = movie?.Title ?? "Movie";
        var certificate = movie?.Certificate ?? "";

        var eventDisplayTitle = eventTitle ?? "Event Ticket";
        var eventDateSuffix   = eventDate.HasValue
            ? $" | {eventDate.Value:dd MMM yyyy, hh:mm tt}"
            : string.Empty;

        var lineDescription = isEventBooking
            ? $"{eventDisplayTitle}{eventDateSuffix}\nConvenience fee/internet handling fee/delivery fee"
            : $"{movieTitle} ({certificate})\nConvenience fee/internet handling fee/delivery fee";

        lines.Add(new InvoiceLine(
            Description:    lineDescription,
            SacCode:        allSettings.GetValueOrDefault("sac_code_convenience", "998554"),
            Qty:            booking.TicketQty,
            Price:          convFeePerTk,
            Discount:       0m,
            TaxableAmount:  convTaxable,
            CgstRate:       cgstRate * 100, CgstAmount: convCgst,
            SgstRate:       sgstRate * 100, SgstAmount: convSgst,
            IgstRate:       igstRate * 100, IgstAmount: convIgst,
            CessRate:       0m,             CessAmount: 0m,
            Total:          convTaxable + convCgst + convSgst + convIgst));

        // Line 2: Offer Processing Fee (only if coupon applied)
        if (booking.CouponId.HasValue && booking.OfferProcessingFee > 0)
        {
            decimal offerTaxable = booking.OfferProcessingFee;
            decimal offerCgst    = Math.Round(offerTaxable * cgstRate, 2);
            decimal offerSgst    = Math.Round(offerTaxable * sgstRate, 2);
            decimal offerIgst    = Math.Round(offerTaxable * igstRate, 2);

            lines.Add(new InvoiceLine(
                Description:   "Offer Processing Fee",
                SacCode:       allSettings.GetValueOrDefault("sac_code_offer", "997159"),
                Qty:           0,
                Price:         0m,
                Discount:      0m,
                TaxableAmount: offerTaxable,
                CgstRate:      cgstRate * 100, CgstAmount: offerCgst,
                SgstRate:      sgstRate * 100, SgstAmount: offerSgst,
                IgstRate:      igstRate * 100, IgstAmount: offerIgst,
                CessRate:      0m,             CessAmount: 0m,
                Total:         offerTaxable + offerCgst + offerSgst + offerIgst));
        }

        decimal totalBeforeTax = lines.Sum(l => l.TaxableAmount);
        decimal totalCgst      = lines.Sum(l => l.CgstAmount);
        decimal totalSgst      = lines.Sum(l => l.SgstAmount);
        decimal totalIgst      = lines.Sum(l => l.IgstAmount);
        decimal totalGst       = totalCgst + totalSgst + totalIgst;
        decimal totalAfterTax  = totalBeforeTax + totalGst;

        var placeOfSupply = StateName(user.StateCode ?? companyStateCode);
        var venueName     = venue?.Name ?? (isEventBooking ? "Event Organizer" : "Cinema");

        var paymentDateTime = payment?.CapturedAt ?? booking.CreatedAt;
        var paymentMethod   = payment?.Method ?? "Mock Payment (Test Mode)";
        var transactionId   = payment?.ProviderPaymentId ?? "N/A";

        return new InvoiceModel(
            InvoiceNumber:       booking.InvoiceNumber ?? GenerateInvoiceNumber(booking),
            IssuedAt:            booking.CreatedAt,
            PlaceOfSupply:       placeOfSupply,
            BookingRef:          booking.BookingRef,
            CustomerName:        user.Name,
            CustomerEmail:       user.Email,
            CustomerStateCode:   user.StateCode ?? companyStateCode,
            CustomerGstin:       null,
            Lines:               lines.ToArray(),
            Gst: new GstSummary(
                TotalBeforeTax: totalBeforeTax,
                Cgst:           totalCgst,
                Sgst:           totalSgst,
                Igst:           totalIgst,
                UgstCess:       0m,
                TotalGst:       totalGst,
                TotalAfterTax:  totalAfterTax),
            AmountInWords:       Common.AmountInWordsConverter.Convert(booking.AmountPaid),
            VenueNoteText:       isEventBooking
                ? $"Value of Rs.{booking.TicketAmount:F2}/- pertains to services provided by Event Organizer: {venueName}."
                : $"Value of Rs.{booking.TicketAmount:F2}/- pertains to services provided by Theatre/Event Organizer/Cinema Owner: {venueName}.",
            PaymentTransactionId: transactionId,
            PaymentTotal:        booking.AmountPaid,
            PaymentDateTime:     paymentDateTime,
            PaymentMethod:       paymentMethod,
            CompanyName:         companyName,
            CompanyGstin:        companyGstin,
            CompanyPan:          companyPan,
            CompanyStateCode:    companyStateCode,
            CompanyAddress:      companyAddress,
            // Full payment summary
            TicketQty:           booking.TicketQty,
            TicketAmount:        booking.TicketAmount,
            ConvenienceFee:      booking.ConvenienceFee,
            ConvenienceFeeGst:   Math.Round(booking.ConvenienceFee * (isIntraState ? 0.18m : 0.18m), 2),
            OfferProcessingFee:  booking.OfferProcessingFee,
            OfferProcessingFeeGst: booking.OfferProcessingFee > 0 ? Math.Round(booking.OfferProcessingFee * 0.18m, 2) : 0m,
            Discount:            booking.Discount,
            AmountPaid:          booking.AmountPaid);
    }

    private static string GenerateInvoiceNumber(Booking b)
    {
        var suffix = Math.Abs(b.Id.GetHashCode()).ToString().PadLeft(9, '0')[..9];
        return $"TIN{b.CreatedAt:yy}{suffix}";
    }

    private static string StateName(string code) => code switch
    {
        "01" => "Jammu & Kashmir",
        "02" => "Himachal Pradesh",
        "03" => "Punjab",
        "04" => "Chandigarh",
        "05" => "Uttarakhand",
        "06" => "Haryana",
        "07" => "Delhi",
        "08" => "Rajasthan",
        "09" => "Uttar Pradesh",
        "10" => "Bihar",
        "18" => "Assam",
        "19" => "West Bengal",
        "20" => "Jharkhand",
        "21" => "Odisha",
        "22" => "Chhattisgarh",
        "23" => "Madhya Pradesh",
        "24" => "Gujarat",
        "27" => "Maharashtra",
        "29" => "Karnataka",
        "32" => "Kerala",
        "33" => "Tamil Nadu",
        "36" => "Telangana",
        "37" => "Andhra Pradesh",
        _    => "India",
    };
}
