# BookKaroo — Company Details (Demo Placeholders)

> ⚠️ **These are placeholder values for demo purposes only.** Replace with real entity details before any production launch or before issuing real GST invoices.

## Settings to Seed in `settings` Table

| Key | Value | Notes |
|---|---|---|
| `company_name` | `BookKaroo Pvt Ltd` | Display name on invoices/emails |
| `company_legal_name` | `BookKaroo Private Limited` | Full legal name |
| `company_gstin` | `24XXXXX0000X1Z5` | **Placeholder** — fake Gujarat GSTIN format |
| `company_pan` | `XXXXX0000X` | **Placeholder** |
| `company_state_code` | `24` | Gujarat — used for intra/inter-state GST routing |
| `company_state_name` | `Gujarat` | |
| `company_address_line1` | `701, Demo Tower, SG Highway` | Placeholder |
| `company_address_line2` | `Bodakdev` | Placeholder |
| `company_city` | `Ahmedabad` | |
| `company_pincode` | `380054` | |
| `company_country` | `India` | |
| `company_phone` | `+91 79 0000 0000` | Placeholder |
| `company_email` | `support@bookkaroo.com` | Placeholder until domain owned |
| `convenience_fee_per_ticket` | `59.00` | BookMyShow-aligned |
| `offer_processing_fee` | `15.00` | Charged when coupon applied |
| `gst_rate` | `0.18` | 18% standard rate |
| `cgst_rate_intra` | `0.09` | When customer state = company state |
| `sgst_rate_intra` | `0.09` | When customer state = company state |
| `igst_rate_inter` | `0.18` | When customer state ≠ company state |
| `sac_code_convenience` | `998554` | |
| `sac_code_offer` | `997159` | |
| `sac_code_other` | `999799` | Footer line |
| `cancellation_fee_pct` | `0` | Free cancellation if >2h before show; convenience fee non-refundable |
| `cancellation_window_hours` | `2` | Min hours before show to allow cancellation |
| `refund_processing_days` | `7` | "Refunds in 7 business days" |
| `support_email` | `support@bookkaroo.com` | |
| `support_url` | `https://bookkaroo.com/help` | |

## Indian State Codes (for `cities.state_code`)

| Code | State |
|---|---|
| 01 | Jammu & Kashmir |
| 02 | Himachal Pradesh |
| 03 | Punjab |
| 04 | Chandigarh |
| 05 | Uttarakhand |
| 06 | Haryana |
| 07 | Delhi |
| 08 | Rajasthan |
| 09 | Uttar Pradesh |
| 10 | Bihar |
| 19 | West Bengal |
| 20 | Jharkhand |
| 21 | Odisha |
| 22 | Chhattisgarh |
| 23 | Madhya Pradesh |
| **24** | **Gujarat** ← Company state |
| 27 | Maharashtra |
| 29 | Karnataka |
| 32 | Kerala |
| 33 | Tamil Nadu |
| 36 | Telangana |
| 37 | Andhra Pradesh |
| 18 | Assam |

(Full list in seed file `/database/seeds/01_cities.sql`)

## Logo Placeholder

Until the SVG is finalized (from Claude design tool), use the **wordmark fallback** in emails and invoices:

```html
<span style="font-family: 'Playfair Display', Georgia, serif; font-size: 32px; font-weight: 700; color: #0A0E1A;">
  Book<span style="color:#E11D74;">Karoo</span>
</span>
```

For the PDF invoice, embed an SVG/PNG logo:
- Path: `backend/src/BookKaroo.Infrastructure/Assets/logo.svg`
- Fallback: render the wordmark text via QuestPDF text rendering with custom fonts

## Replacing Placeholders Before Launch

When you're ready for production:

1. Get real GSTIN, PAN registered
2. Replace `company_gstin`, `company_pan`, `company_state_code` etc. via admin Settings page
3. Update `company_address_line1/2`, `company_city`, `company_pincode`
4. Verify domain in Resend → switch `RESEND_FROM` from `onboarding@resend.dev` to `tickets@bookkaroo.com`
5. Update `cancellation_window_hours` and policy text to legal-team-approved version
6. Insert real signature image at `backend/src/BookKaroo.Infrastructure/Assets/signature.png`
7. Run a test booking → verify invoice PDF + email both reflect real values
