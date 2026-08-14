# BookKaroo — Database Schema

> ⚠️ **Source-of-truth warning:** two schema sources exist and they don't fully agree:
> 1. `backend/database/migrations/001_initial_schema.sql` … `014_AddLysFeature.sql` (14 files) — hand-written, `PascalCase` (`"Users"`, `"Bookings"`, ...), matching the live schema for 26 of its 27 tables. Running all 14 in order against a fresh Postgres database (e.g. via Supabase SQL Editor) reproduces almost the full live schema, including Partner Portal (`013_PartnerPortal.sql`) and LYS (`014_AddLysFeature.sql`). **This is the most complete source today.**
> 2. **EF Core migrations** (`backend/src/BookKaroo.Infrastructure/Data/Migrations/`) — what `dotnet ef database update` applies. Only 21 of the 27 tables the app's `DbContext` expects; missing `LysOrganizers`/`LysEvents`/`LysUploads` (created separately by raw idempotent SQL in `Program.cs` on every boot), `PartnerProfiles`, and `PartnerVenueAccesses`.
> 3. **`EventTicketLocks`** exists on the live database but has **no creation script anywhere in this repo**. Anyone provisioning a fresh database needs to add this table manually or write a migration for it before Partner/LYS ticket-locking features will work.
>
> **Until this is fixed**, the most complete path to a working fresh database is: run `backend/database/migrations/001_initial_schema.sql` through `014_AddLysFeature.sql` in order, then manually create `EventTicketLocks` (see `EventTicketLock.cs` in `BookKaroo.Domain/Entities` for the shape). `dotnet ef database update` alone is not sufficient on its own.

## Column Diffs (GST / pricing additions over the original base schema)
- `cities`: added `state_code` (for GST routing)
- `users`: added `state_code` (auto-filled from city, used in invoice)
- `bookings`: added GST line fields (`taxable_amount`, `cgst`, `sgst`, `igst`, `invoice_number`, `invoice_url`, `customer_state_code`, `payment_method_label`, `mock_transaction_id`)
- `payments`: simplified for Mock provider (`provider`, `provider_order_id`, `provider_payment_id` instead of `razorpay_*` columns)
- `settings`: documented all keys for company details + GST + fees (see `/docs/COMPANY-DETAILS.md`)

All other tables unchanged from the base file. Below shows ONLY the changed/new columns and tables.

## Changed Tables

### users (changed)
```diff
+ state_code  text             -- 2-digit, auto-filled from city.state_code
```

### cities (changed)
```diff
+ state_code  text NOT NULL    -- 2-digit GST state code (e.g., '24' for Gujarat)
```

### bookings (changed)
```diff
+ ticket_amount        numeric(10,2) NOT NULL  -- qty × seat price; goes to venue
+ taxable_amount       numeric(10,2) NOT NULL  -- convenience_fee + offer_fee (subject to GST)
+ cgst                 numeric(10,2) NOT NULL DEFAULT 0
+ sgst                 numeric(10,2) NOT NULL DEFAULT 0
+ igst                 numeric(10,2) NOT NULL DEFAULT 0
+ offer_processing_fee numeric(10,2) NOT NULL DEFAULT 0
+ customer_state_code  text       NOT NULL
+ ticket_qty           int        NOT NULL
+ invoice_number       text       UNIQUE        -- TIN... format, generated post-payment
+ invoice_url          text                     -- Supabase Storage URL
+ qr_url               text                     -- already existed; renamed from qr_code_url
+ payment_method_label text                     -- "Mock Payment", "Credit Card" etc.
- subtotal              -- removed; replaced by ticket_amount + convenience_fee + offer_processing_fee
```

### payments (changed — provider-agnostic)
```diff
+ provider              text NOT NULL              -- 'mock' | 'razorpay' | 'paypal'
+ provider_order_id     text                       -- replaces razorpay_order_id
+ provider_payment_id   text                       -- replaces razorpay_payment_id
+ provider_signature    text                       -- replaces razorpay_signature
+ provider_payload      jsonb                      -- last webhook / capture response
+ captured_at           timestamptz                -- when payment status moved to 'captured'
- razorpay_order_id, razorpay_payment_id, razorpay_signature, webhook_payload   -- removed (rolled into provider_*)
```

## New Settings Keys

```sql
INSERT INTO settings (key, value) VALUES
  ('company_name',              '"BookKaroo Pvt Ltd"'),
  ('company_legal_name',        '"BookKaroo Private Limited"'),
  ('company_gstin',             '"24XXXXX0000X1Z5"'),
  ('company_pan',               '"XXXXX0000X"'),
  ('company_state_code',        '"24"'),
  ('company_state_name',        '"Gujarat"'),
  ('company_address_line1',     '"701, Demo Tower, SG Highway"'),
  ('company_address_line2',     '"Bodakdev"'),
  ('company_city',              '"Ahmedabad"'),
  ('company_pincode',           '"380054"'),
  ('company_country',           '"India"'),
  ('company_phone',             '"+91 79 0000 0000"'),
  ('company_email',             '"support@bookkaroo.com"'),
  ('convenience_fee_per_ticket','59.00'),
  ('offer_processing_fee',      '15.00'),
  ('gst_rate',                  '0.18'),
  ('cgst_rate_intra',           '0.09'),
  ('sgst_rate_intra',           '0.09'),
  ('igst_rate_inter',           '0.18'),
  ('sac_code_convenience',      '"998554"'),
  ('sac_code_offer',            '"997159"'),
  ('sac_code_other',            '"999799"'),
  ('cancellation_window_hours', '2'),
  ('refund_processing_days',    '7'),
  ('payment_provider',          '"mock"'),
  ('support_email',             '"support@bookkaroo.com"'),
  ('support_url',               '"https://bookkaroo.com/help"');
```

## New Storage Buckets (Supabase Storage)

| Bucket | Purpose | Public | Naming |
|---|---|---|---|
| `qr-codes` | QR PNG per booking | Public read | `{booking_ref}.png` |
| `invoices` | GST invoice PDFs | Authenticated read (signed URLs) | `{user_id}/{booking_ref}_GST_Invoice.pdf` |
| `posters` | Movie posters cached from TMDB | Public read | `{tmdb_id}.jpg` |

Backend uploads via `service_role` key. Frontend reads via signed URLs (for invoices) or direct public URLs (qr-codes, posters).

## Updated GST Calculation in Service Layer

```csharp
// BookKaroo.Application/Services/PricingService.cs
public PricingBreakdown Calculate(int qty, decimal seatPrice, string customerStateCode, Coupon? coupon, AppSettings s)
{
    bool intraState = customerStateCode == s.CompanyStateCode;

    decimal ticketAmount = qty * seatPrice;
    decimal convenienceFee = qty * s.ConvenienceFeePerTicket;
    decimal convenienceTaxable = convenienceFee;
    decimal convenienceCgst = intraState ? Math.Round(convenienceTaxable * s.CgstRateIntra, 2) : 0;
    decimal convenienceSgst = intraState ? Math.Round(convenienceTaxable * s.SgstRateIntra, 2) : 0;
    decimal convenienceIgst = intraState ? 0 : Math.Round(convenienceTaxable * s.IgstRateInter, 2);

    decimal offerProcessingFee = 0;
    decimal offerCgst = 0, offerSgst = 0, offerIgst = 0;
    decimal discount = 0;

    if (coupon != null)
    {
        discount = coupon.Type switch {
            "flat" => coupon.Value,
            "percent" => Math.Min(coupon.MaxDiscount, ticketAmount * coupon.Value / 100),
            _ => 0
        };
        offerProcessingFee = s.OfferProcessingFee;
        offerCgst = intraState ? Math.Round(offerProcessingFee * s.CgstRateIntra, 2) : 0;
        offerSgst = intraState ? Math.Round(offerProcessingFee * s.SgstRateIntra, 2) : 0;
        offerIgst = intraState ? 0 : Math.Round(offerProcessingFee * s.IgstRateInter, 2);
    }

    decimal totalCgst = convenienceCgst + offerCgst;
    decimal totalSgst = convenienceSgst + offerSgst;
    decimal totalIgst = convenienceIgst + offerIgst;
    decimal taxableAmount = convenienceTaxable + offerProcessingFee;
    decimal amountPaid = ticketAmount + taxableAmount + totalCgst + totalSgst + totalIgst - discount;

    return new PricingBreakdown(
        TicketAmount: ticketAmount,
        ConvenienceFee: convenienceFee,
        OfferProcessingFee: offerProcessingFee,
        TaxableAmount: taxableAmount,
        Cgst: totalCgst,
        Sgst: totalSgst,
        Igst: totalIgst,
        Discount: discount,
        AmountPaid: amountPaid
    );
}
```

---

## Open Item: Reconcile Schema Sources
Not documented here at all: `PartnerProfile`, `PartnerVenueAccess`, `LysOrganizer`, `LysEvent`, `LysUpload`, `EventTicketLock` — all real, live entities (see `backend/src/BookKaroo.Domain/Entities/`) added after this doc was last updated. Whoever picks this up next should: (1) write the missing `EventTicketLocks` migration — it exists live but has no script anywhere, (2) pick **one** schema source going forward — `backend/database/migrations/` is the more complete and correct one today, so either generate a proper EF migration from the current model to replace it, or commit to hand-written SQL as the source of truth and delete the EF migrations folder to stop the two from diverging further, and (3) regenerate this doc from the real `BookKarooDbContext` model.

## Maintenance Jobs (unchanged)
*(see v1 § 6)*
