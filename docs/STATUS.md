# BookKaroo — Implementation Status

> Live tracker of what's built, what's partial, and what's next.
> Verified against the codebase | Full spec: [PRD.md](PRD.md) | Testing state: [TESTING.md](TESTING.md)

---

## Legend
- ✅ Complete and working
- 🔄 Partial / in progress
- ❌ Not started

---

## Infrastructure

| Component | Status | Notes |
|-----------|--------|-------|
| Database schema (26+ tables) | ✅ | `backend/database/migrations/001–014` |
| Supabase Realtime on seat_locks | ✅ | REPLICA IDENTITY FULL applied |
| Seat lock sweep (60s) | ✅ | In-process `SeatLockSweepService` |
| Payment provider abstraction | ✅ | `IPaymentProvider` — Razorpay + mock |
| Email sending (Resend) | ✅ | Templates in [EMAIL-TEMPLATES.md](EMAIL-TEMPLATES.md) |
| GST invoice PDF (QuestPDF) | ✅ | CGST/SGST/IGST split by state code |
| TMDB integration | ✅ | Metadata + poster sync |
| Idempotency on payments | ✅ | `Idempotency-Key` header |
| Rate limiting | ✅ | AspNetCoreRateLimit, per-endpoint rules |
| Admin audit log | 🔄 | Table exists; not every mutation logged |
| CI/CD pipeline | ❌ | Deploys via Vercel/Render git auto-deploy, no test gate |

---

## Backend

All endpoints are implemented behind a Controller → Service → Repository layering.

| Area | Status | Surface |
|------|--------|---------|
| Auth | ✅ | signup, login, refresh, logout, forgot/reset password, me |
| Users | ✅ | profile update, change password, delete account |
| Movies | ✅ | listing + filters, detail, showtimes, reviews, remind-me |
| Events / Plays / Sports | ✅ | listing, detail, availability, remind-me, order |
| Shows & Seats | ✅ | showtimes, seat map, seat locks (advisory-lock backed) |
| Bookings | ✅ | create, my bookings, detail by ref, invoice PDF, cancel |
| Payments | ✅ | Razorpay order + signature verify; mock-capture (dev only) |
| Coupons | ✅ | validation + redemption rules |
| Search / Cities / Home | ✅ | global search, city list + geo-detect, home feed |
| Chatbot | ✅ | Groq (Llama 3.3 70B), gated by `CHATBOT_ENABLED` |
| Admin | ✅ | dashboard, catalog CRUD, bookings ops, users, reports/CSV, CMS, settings |
| Partner portal | ✅ | dashboard, venues/screens, shows, bookings, reviews, reports |
| LYS (List Your Show) | ✅ | organizer registration, event submission, three-tier review |
| Razorpay webhook receiver | ❌ | Verification is client-callback based today |

---

## Frontend

Feature-based modules under `frontend/src/features/`, all routes lazy-loaded.

| Area | Status | Notes |
|------|--------|-------|
| App shell, routing, theme | ✅ | Dark theme + `ThemeContext` |
| Auth (signup/login/reset) | ✅ | Protected-route guards |
| Home + discovery | ✅ | Hero, rails, city-aware content |
| Movies (list, filters, detail) | ✅ | Trailer modal, reviews |
| Events / Plays / Sports | ✅ | Listing + detail + checkout |
| Showtimes | ✅ | |
| Seat selection | ✅ | Live seat state via Supabase Realtime |
| Checkout + payment | ✅ | GST breakdown, Razorpay + mock flow |
| Confirmation | ✅ | |
| Profile & My Bookings | ✅ | Detail, invoice, QR, cancel |
| Admin panel | ✅ | Catalog, bookings, users, reports, CMS, settings, LYS review |
| Partner portal | ✅ | Dashboard, venues, shows, bookings, reviews, LYS submissions |
| LYS organizer flow | ✅ | Register, create-event wizard, my events |
| Chatbot UI | ✅ | |
| Blog (static) | ❌ | Placeholder page |
| Frontend test suite | ❌ | Vitest + RTL not yet wired up |

---

## Booking Flow (end-to-end)

Movies and events both run the full path:

```
browse → detail → showtimes → seat selection (seat locks + Realtime)
      → checkout (GST, coupons) → payment → confirmation
      → my bookings → invoice PDF / QR / cancel + refund
```

---

## Known Limitations

- **Razorpay webhook receiver not implemented** — payment confirmation relies on the client callback plus signature verification. A server-side webhook is the correct production hardening.
- **Frontend has no automated tests.** Backend has a small xUnit suite; see [TESTING.md](TESTING.md) for the honest coverage picture.
- **No CI pipeline** — nothing gates a deploy on tests passing yet.
- **Audit logging is incomplete** — the table exists but not all admin mutations write to it.
- **Supabase Storage RLS policies need review** before any real production use.
- Company/GST values ship as **demo placeholders** — see [COMPANY-DETAILS.md](COMPANY-DETAILS.md) before issuing real invoices.

---

## Next Priorities

1. Implement the Razorpay webhook receiver (close the payment-confirmation gap)
2. Wire up Vitest + React Testing Library and add coverage on the booking path
3. Add a CI workflow that runs `dotnet test` + typecheck on every PR
4. Complete admin audit logging across all mutations
5. Review Supabase Storage RLS policies
