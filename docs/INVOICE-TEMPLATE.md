# BookKaroo — GST Invoice Template

> Generated server-side via **QuestPDF** (Apache 2.0 license, free for commercial use, fluent C# API).
> Output: A4 portrait, single page, GST-compliant.
> Filename: `{booking_ref}_GST_Invoice.pdf` (e.g., `BK-20260320-WS22Q_GST_Invoice.pdf`).

## Why QuestPDF
- Pure C#, no external binaries (vs. wkhtmltopdf which is being deprecated)
- Vector text + images = small file size
- Apache 2.0 (no license fees for commercial use under our scale)
- Active maintenance, modern .NET 8 support

## NuGet Setup
```bash
dotnet add package QuestPDF --version 2024.10.3
```

In `Program.cs`:
```csharp
QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
```

---

## Layout Spec (matching the BookMyShow sample)

### Page Setup
- A4 portrait (210mm × 297mm)
- Margins: 30 left/right, 30 top/bottom
- Default font: Inter (or fallback Helvetica)
- Default font size: 10pt
- Color: black on white (no theme)

### Section Order

```
┌─────────────────────────────────────────────────────────────────┐
│ Invoice                          BookKaroo logo (right)         │
│                                                                 │
│ Invoice Number: TIN...        Invoice issued by:                │
│ Date of issue:                BookKaroo Pvt Ltd                 │
│ Place of supply: Gujarat      GSTIN: 24XXXXX0000X1Z5            │
│ Booking ID: BK-...            PAN: XXXXX0000X                   │
│ Customer GSTIN: -             State code: 24                    │
│ State Code: 24                Company Address: ...              │
│ Customer Name: Aarav S                                          │
│ Customer Email: aarav@...                                       │
├─────────────────────────────────────────────────────────────────┤
│ [LINE ITEMS TABLE — see below]                                  │
├─────────────────────────────────────────────────────────────────┤
│                          Total Amount before Tax: 133.00        │
│                          Add. CGST: 11.97                       │
│                          Add. SGST: 11.97                       │
│                          Add. IGST: 0.00                        │
│                          Add. UGST or Cess: 0.00                │
│                          ──────────────────────────             │
│                          Total Amount: GST: 23.94               │
│                          Total Amount after Tax: 156.94         │
│                          ──────────────────────────             │
│                          Total Amount after Tax: 156.94         │
│                                                                 │
│ One Hundred Fifty Six Rupee(s) And Ninety Four Paisa Only.      │
├─────────────────────────────────────────────────────────────────┤
│ Note:                                                           │
│ Value of Rs.900.00/- pertains to services provided by           │
│ Theatre/Event Organizer/Cinema Owner: {venue_name}              │
│                                                                 │
│ RCM: No                                                         │
│                                                                 │
│ Payment Reference                                               │
│ Transaction Id & Amount: {payment_id}, Rs. {total}/-            │
│ Date & Time: {payment_datetime}                                 │
│ Mode of payment: {payment_method}                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Certified that the particulars given above are true and correct │
│ For BookKaroo Pvt Ltd.                                          │
│                                                                 │
│           [signature image placeholder]                         │
│                                                                 │
│           Authorised signatory                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Line Items Table — Columns
| Column | Width | Notes |
|---|---|---|
| Product Description | 18% | Wraps |
| SAC Code | 8% | |
| Qty | 5% | center |
| Price | 8% | right, 2dp |
| Discount | 8% | right, 2dp |
| Taxable Amount | 10% | right, 2dp |
| CGST Rate | 5% | center |
| CGST Amount | 7% | right |
| SGST Rate | 5% | center |
| SGST Amount | 7% | right |
| IGST Rate | 5% | center |
| IGST Amount | 7% | right |
| UT/Cess Rate | 4% | center |
| UT/Cess Amount | 5% | right |
| Total | 8% | right, 2dp, bold |

**Header row:** light gray background (`#F4F4F5`), bold, 9pt
**Data rows:** white, 9pt, 1px gray dividers

**Row 1 — Convenience Fee (always present):**
- Description: `{movie_title} ({certificate})\nConvenience fee/internet handling fee/delivery fee`
- SAC: `998554`
- Qty: `{ticket_qty}`
- Price: `59.00`
- Discount: `0`
- Taxable: `qty × 59`
- CGST/SGST or IGST per state rule
- Total: `taxable + GST`

**Row 2 — Offer Processing Fee (only if coupon applied):**
- Description: `Offer Processing Fee`
- SAC: `997159`
- Qty: `0`
- Price: `0`
- Discount: `0`
- Taxable: `15.00`
- GST same rule
- Total: `17.70`

**Row 3 — Total (sum row):**
- bold, span Description column
- sums: Qty, Taxable, all GST columns, Total

---

## C# Implementation Sketch

```csharp
// BookKaroo.Infrastructure/Pdf/InvoicePdfGenerator.cs
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

public class InvoicePdfGenerator : IInvoicePdfGenerator
{
    private readonly CompanySettings _company;

    public InvoicePdfGenerator(IOptions<CompanySettings> company)
    {
        _company = company.Value;
    }

    public byte[] Generate(InvoiceModel model)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Inter"));

                page.Content().Column(col =>
                {
                    col.Spacing(16);

                    HeaderSection(col, model);
                    LineItemsTable(col, model);
                    TaxSummary(col, model);
                    NoteAndPayment(col, model);
                    Signature(col);
                });

                page.Footer().AlignCenter().Text(t =>
                {
                    t.Span("Page ").FontSize(8).FontColor(Colors.Grey.Medium);
                    t.CurrentPageNumber().FontSize(8).FontColor(Colors.Grey.Medium);
                    t.Span(" / ").FontSize(8).FontColor(Colors.Grey.Medium);
                    t.TotalPages().FontSize(8).FontColor(Colors.Grey.Medium);
                });
            });
        }).GeneratePdf();
    }

    void HeaderSection(ColumnDescriptor col, InvoiceModel m) { /* ... */ }
    void LineItemsTable(ColumnDescriptor col, InvoiceModel m) { /* ... */ }
    void TaxSummary(ColumnDescriptor col, InvoiceModel m) { /* ... */ }
    void NoteAndPayment(ColumnDescriptor col, InvoiceModel m) { /* ... */ }
    void Signature(ColumnDescriptor col) { /* ... */ }
}
```

## Invoice Model

```csharp
public record InvoiceModel(
    string InvoiceNumber,           // TIN-yy-XXXXXXXXX (auto-generated)
    DateTime IssuedAt,
    string PlaceOfSupply,           // customer state name
    string BookingRef,
    string CustomerName,
    string CustomerEmail,
    string CustomerStateCode,
    string? CustomerGstin,
    InvoiceLine[] Lines,
    GstSummary Gst,
    string AmountInWords,
    string VenueNoteText,           // e.g., "Value of Rs.900.00 pertains to..."
    string PaymentTransactionId,
    decimal PaymentTotal,
    DateTime PaymentDateTime,
    string PaymentMethod
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
```

## Service Logic

```csharp
public class InvoiceBuilder
{
    public InvoiceModel Build(Booking booking, Show show, User user, ApplicationSettings settings)
    {
        bool isIntraState = user.StateCode == settings.CompanyStateCode;
        decimal cgstRate = isIntraState ? 0.09m : 0m;
        decimal sgstRate = isIntraState ? 0.09m : 0m;
        decimal igstRate = isIntraState ? 0m : 0.18m;

        var lines = new List<InvoiceLine>();

        // Line 1: Convenience fee
        decimal convTaxable = booking.ConvenienceFee;  // qty × 59
        lines.Add(new InvoiceLine(
            Description: $"{show.Movie.Title} ({show.Movie.Certificate})\nConvenience fee/internet handling fee/delivery fee",
            SacCode: settings.SacCodeConvenience,        // "998554"
            Qty: booking.TicketQty,
            Price: settings.ConvenienceFeePerTicket,     // 59.00
            Discount: 0m,
            TaxableAmount: convTaxable,
            CgstRate: cgstRate * 100, CgstAmount: Math.Round(convTaxable * cgstRate, 2),
            SgstRate: sgstRate * 100, SgstAmount: Math.Round(convTaxable * sgstRate, 2),
            IgstRate: igstRate * 100, IgstAmount: Math.Round(convTaxable * igstRate, 2),
            CessRate: 0, CessAmount: 0,
            Total: convTaxable + Math.Round(convTaxable * 0.18m, 2)
        ));

        // Line 2: Offer processing fee (if coupon)
        if (booking.CouponId.HasValue)
        {
            decimal offerTaxable = settings.OfferProcessingFee;  // 15.00
            lines.Add(new InvoiceLine(
                Description: "Offer Processing Fee",
                SacCode: settings.SacCodeOffer,                  // "997159"
                Qty: 0,
                Price: 0,
                Discount: 0,
                TaxableAmount: offerTaxable,
                CgstRate: cgstRate * 100, CgstAmount: Math.Round(offerTaxable * cgstRate, 2),
                SgstRate: sgstRate * 100, SgstAmount: Math.Round(offerTaxable * sgstRate, 2),
                IgstRate: igstRate * 100, IgstAmount: Math.Round(offerTaxable * igstRate, 2),
                CessRate: 0, CessAmount: 0,
                Total: offerTaxable + Math.Round(offerTaxable * 0.18m, 2)
            ));
        }

        decimal totalBeforeTax = lines.Sum(l => l.TaxableAmount);
        decimal totalCgst = lines.Sum(l => l.CgstAmount);
        decimal totalSgst = lines.Sum(l => l.SgstAmount);
        decimal totalIgst = lines.Sum(l => l.IgstAmount);
        decimal totalGst = totalCgst + totalSgst + totalIgst;
        decimal totalAfterTax = totalBeforeTax + totalGst;

        return new InvoiceModel(
            InvoiceNumber: GenerateInvoiceNumber(booking),
            IssuedAt: booking.CreatedAt,
            PlaceOfSupply: user.City.State,
            BookingRef: booking.BookingRef,
            CustomerName: user.Name,
            CustomerEmail: user.Email,
            CustomerStateCode: user.StateCode,
            CustomerGstin: null,
            Lines: lines.ToArray(),
            Gst: new GstSummary(totalBeforeTax, totalCgst, totalSgst, totalIgst, 0, totalGst, totalAfterTax),
            AmountInWords: AmountInWordsConverter.Convert(booking.AmountPaid),
            VenueNoteText: $"Value of Rs.{booking.TicketAmount:F2}/- pertains to services provided by Theatre/Event Organizer/Cinema Owner: {show.Venue.Name}.",
            PaymentTransactionId: booking.Payment.RazorpayPaymentId ?? booking.Payment.MockTransactionId,
            PaymentTotal: booking.AmountPaid,
            PaymentDateTime: booking.Payment.CapturedAt!.Value,
            PaymentMethod: booking.Payment.Method
        );
    }

    string GenerateInvoiceNumber(Booking b)
    {
        // Format: TIN-{yy}-{9-digit-sequential}
        // For MVP: TIN + last 9 digits of booking createdAt ticks
        return $"TIN{b.CreatedAt:yy}{b.Id.GetHashCode():D9}".Substring(0, 18);
    }
}
```

## Amount-In-Words Helper

For Indian numbering (lakh/crore), use a custom converter:

```csharp
public static class AmountInWordsConverter
{
    public static string Convert(decimal amount)
    {
        long rupees = (long)Math.Floor(amount);
        int paise = (int)Math.Round((amount - rupees) * 100);

        string words = ToIndianWords(rupees) + " Rupee(s)";
        if (paise > 0)
            words += " And " + ToIndianWords(paise) + " Paisa";
        else
            words += " And Zero Paisa";

        return words + " Only.";
    }

    static string ToIndianWords(long n) {
        // Implements: One, Eleven, Twenty, Hundred, Thousand, Lakh, Crore
        // (full implementation in /backend/src/BookKaroo.Application/Common/AmountInWordsConverter.cs)
    }
}
```

**Test cases:**
- `156.94` → `"One Hundred Fifty Six Rupee(s) And Ninety Four Paisa Only."`
- `1056.94` → `"One Thousand Fifty Six Rupee(s) And Ninety Four Paisa Only."`
- `100000.00` → `"One Lakh Rupee(s) And Zero Paisa Only."`
- `12500000.50` → `"One Crore Twenty Five Lakh Rupee(s) And Fifty Paisa Only."`

## Storage
- Generated PDF saved to **Supabase Storage** bucket `invoices/`
- Path: `invoices/{user_id}/{booking_ref}_GST_Invoice.pdf`
- Public URL stored in `bookings.invoice_url`
- Also attached to confirmation email
- Re-downloadable from "My Bookings" page

## Validation Tests (xUnit)

```csharp
[Theory]
[InlineData("Gujarat", "Gujarat", 0.09, 0.09, 0)]      // intra-state
[InlineData("Gujarat", "Maharashtra", 0, 0, 0.18)]      // inter-state
public void GstCalculation_AppliesCorrectRates(string company, string customer, decimal cgst, decimal sgst, decimal igst)
{
    // arrange + act + assert
}

[Fact]
public void Invoice_TotalsMatchSum()
{
    // assert total = taxable + cgst + sgst + igst (no rounding mismatch)
}

[Fact]
public void Invoice_WithCoupon_IncludesOfferProcessingLine()
{
    // assert 2 lines when CouponId set, 1 line otherwise
}
```
