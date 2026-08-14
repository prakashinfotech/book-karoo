# BookKaroo — API Reference

Base path: `/api` (except health check, at `/health`). Auth: `Authorization: Bearer <token>` unless noted. Full request/response contracts live in the controllers themselves (`backend/src/BookKaroo.Api/Controllers/`) and their DTOs (`backend/src/BookKaroo.Application/DTOs/`) — this doc is an accurate index, not a full per-field spec (that's a bigger doc than exists today; see the note at the bottom).

## Controller Index

| Controller | Route prefix | Endpoints | Covers |
|---|---|---|---|
| `AuthController` | `/api/auth` | 7 | signup, login, refresh, logout, forgot/reset password |
| `UsersController` | `/api/users` | 3 | current user profile (get/update/soft-delete) |
| `MoviesController` | `/api/movies` | 7 | movie listing/detail, admin CRUD |
| `EventsController` | `/api/events` | 6 | events/plays/sports/activities listing/detail, admin CRUD |
| `ShowsController` | `/api/shows` | 2 | showtimes by movie/event/date/city, seat layout |
| `SeatLocksController` | `/api/seat-locks` | 2 | acquire/release a seat lock |
| `BookingsController` | `/api/bookings` | 4 | create booking, list mine, get by ref, cancel |
| `PaymentsController` | `/api/payments` | 3 | order, mock-capture, verify — see detail below |
| `CouponsController` | `/api/coupons` | 1 | coupon validation |
| `CitiesController` | `/api/cities` | 2 | city list, autocomplete |
| `SearchController` | `/api/search` | 1 | global search |
| `HelpController` | `/api/help` | 1 | contact/support form submission |
| `HomeController` | `/api/home` | 1 | homepage aggregate feed (rails, hero, IPL strip) |
| `SettingsController` | `/api/settings` | 1 | public settings (company details, fee config) |
| `ChatbotController` | `/api/chatbot` | 1 | Groq-backed AI assistant message endpoint |
| `StubController` | `/api/venues` | 2 | **not implemented** — placeholder stub responses only |
| `AdminController` | `/api/admin` | 54 | full admin panel: movies/events/venues/shows/bookings/users/reports/CMS/settings CRUD |
| `AdminPartnerController` | `/api/admin/partners` | 8 | admin review/approval of partner accounts |
| `AdminLysController` | `/api/admin/lys` | 10 | admin review of organizer (LYS) event submissions |
| `PartnerController` | `/api/partner` | 20 | partner portal: own venues/shows/bookings/reports/reviews |
| `PartnerLysController` | `/api/partner/lys` | 6 | partner-side view of LYS submissions for their venues |
| `LysController` | `/api/lys` | 14 | organizer self-serve: register, submit/edit events, uploads |
| `HealthController` | `/health` | 1 | liveness check |

`AuthController` and `PaymentsController` require the `Idempotency-Key` header on the create-order endpoint specifically (see below); most admin/partner endpoints require the matching `role` claim on the JWT (`admin` or `partner`).

---

## Payments — Detailed Contract

### POST /api/payments/order
*Auth required, idempotent via `Idempotency-Key` header (UUID)*
**Body:** `{ showId, seats[], couponCode? }`
**Returns:**
```json
{
  "orderId": "ord_abc123",
  "provider": "mock",
  "providerOrderId": "MOCK-1234567890",
  "amount": 606.94,
  "currency": "INR",
  "breakdown": {
    "ticketAmount": 900.00,
    "convenienceFee": 118.00,
    "convenienceFeeGst": 21.24,
    "offerProcessingFee": 15.00,
    "offerProcessingFeeGst": 2.70,
    "discount": 450.00,
    "cgst": 11.97,
    "sgst": 11.97,
    "igst": 0.00,
    "amountPaid": 606.94
  },
  "checkoutUrl": null,
  "providerKey": null
}
```
When `PAYMENT_PROVIDER=razorpay`, `checkoutUrl` and `providerKey` are populated for Razorpay SDK init.

### POST /api/payments/mock-capture
*Auth required.* **Returns 404 in Production** (guarded — mock provider throws if `ASPNETCORE_ENVIRONMENT=Production`).
**Body:** `{ providerOrderId, simulateFailure?: false }`
**Returns:**
- `200 { booking, invoice_url, qr_url }` on success
- `402 { error: "Payment declined" }` if `simulateFailure=true`

### POST /api/payments/verify
*Used with the Razorpay provider.*
**Body:** `{ providerOrderId, providerPaymentId, signature }`

There is no dedicated inbound `/api/payments/webhook` receiver yet — async provider callbacks are not currently handled.

---

## Note on This Doc

This is an index, not an exhaustive per-endpoint contract. To get the full request/response shape for any endpoint: open the controller action in `backend/src/BookKaroo.Api/Controllers/`, then follow its DTO types into `backend/src/BookKaroo.Application/DTOs/`. Consider generating a real OpenAPI/Swagger doc from the running API (`Swagger.Enabled: true` in `appsettings.Development.json`, available at `/swagger` locally) instead of hand-maintaining this table as the endpoint count grows.
