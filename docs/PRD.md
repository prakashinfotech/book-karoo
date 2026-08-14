# BookKaroo — Product Requirements Document (Phase 1)

> **Platform:** India's premium entertainment ticket booking platform
> **Site Name:** BookKaroo | **Tagline:** Book the moment. Karo it now.
> **Owner:** Sanjay | **Phase:** 1 (MVP) | **Version:** 2.0 (complete, self-contained)
> **Last updated:** 2026-05-09

---

## 1. Vision

BookKaroo is an entertainment ticket booking platform for the Indian market — a BookMyShow competitor. It supports booking for **Movies, Live Events, Concerts, Plays, Sports, Activities, and TATA IPL 2026** across 25 Indian cities.

Phase 1 delivers a complete end-to-end MVP: discover → select seats → mock pay → receive ticket + email + GST invoice. Plus a full admin panel.

---

## 2. User Roles & Permissions

| Role | Permissions |
|---|---|
| **Guest** | Browse, search, view movie/event details, view reviews |
| **Registered User** | All Guest permissions + book tickets, write reviews (after booking), save favorites, manage profile, view/cancel bookings |
| **Admin** | Full CRUD on all entities (movies, events, venues, shows, users), manage banners, reports, settings, user management |

---

## 3. Tech Stack (Locked)

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand (UI state), TanStack Query (server state) |
| Routing | React Router v6 (lazy-loaded routes) |
| Forms | react-hook-form + zod |
| Animation | framer-motion |
| Backend | .NET 8 Web API (Controller → Service → Repository) |
| ORM | EF Core 8 + Npgsql |
| Validation | FluentValidation |
| Logging | Serilog |
| Auth | JWT (access 2hours, httpOnly refresh cookie 30d) + BCrypt cost 12 |
| Database | Supabase (PostgreSQL hosted, free tier) |
| Realtime | Supabase Realtime (WebSocket seat updates) |
| Payments | Mock provider (Phase 1) → Razorpay (Phase 1.5 after Vercel deploy) |
| Email | Resend (free tier) |
| Movie Metadata | TMDB API (free, 40 req/10s) |
| QR Storage | Supabase Storage |
| Version Control | GitHub |

### Database Rules
- No foreign keys — logical references via UUID columns + indexes
- 3NF schema design
- Soft deletes via `deleted_at` on all mutable tables
- All tables: `id (uuid)`, `created_at`, `updated_at`, `deleted_at`
- Money: `numeric(10,2)`, never float
- App-layer integrity enforcement (existence checks before insert)

---

## 4. Feature Requirements

---

### 4.1 Authentication

#### Sign Up
- Fields: email, password, name, DOB, gender, city, mobile, profile pic
- Password rules: min 8 chars, ≥1 uppercase, ≥1 number, ≥1 special character

#### Login
- Identifier: email OR mobile + password
- JWT access token (2 hours) returned in response body
- Refresh token (30 days) in httpOnly cookie
- Token rotation on every refresh

#### Forgot Password
- Input: email address
- Always return 200 (prevent email enumeration)
- Send reset link via Resend (expires 1 hour)

#### Reset Password
- Input: token + new password
- Invalidate token after use

#### Token Refresh
- `POST /auth/refresh` reads httpOnly cookie
- Returns new access token + rotates refresh token

#### Logout
- Clears refresh token cookie
- Invalidates refresh token in DB

#### Rate Limiting (Security)
- Auth endpoints: 10 req/min/IP
- Payment endpoints: 30 req/min/user
- All others: 100 req/min/user

---

### 4.2 User Profile

- View and edit: name, DOB, gender, city, mobile, profile pic URL
- Change password (requires current password verification)
- Preferences: language[], genre[], notifications (boolean)
- `state_code` field (auto-filled from city, used in GST invoice calculation)
- Soft delete account (`deleted_at` set, data retained for legal compliance)

---

### 4.3 Location & City Selection

- **Auto-detect** city via IP geolocation on first visit
- Show city selection screen if auto-detect fails
- **Manual selector**: modal with search + autocomplete
- Persist selected city in `localStorage`
- **Search with autocomplete** across city names

**25 Seed Cities:**
Mumbai, Delhi-NCR, Bangalore, Hyderabad, Ahmedabad, Chennai, Pune, Kolkata, Jaipur, Lucknow, Chandigarh, Kochi, Goa, Indore, Bhopal, Nagpur, Surat, Vadodara, Coimbatore, Mysore, Visakhapatnam, Bhubaneswar, Guwahati, Patna, Thiruvananthapuram

Each city has: name, slug, state, state_code (2-digit GST code), latitude, longitude.

---

### 4.4 Home Page

**Header (sticky):**
- BookKaroo logo (left)
- City selector pill: "📍 Ahmedabad ▾"
- Search bar (expandable, global)
- Sign In button

**Hero Carousel:**
- Full-width, ~70vh desktop / ~50vh mobile
- Movie/event backdrop as background image
- Gradient overlay (dark bottom 60%)
- Movie title (Playfair Display, large), rating badge, language tags, format tags
- "🎟 Book Tickets" CTA (crimson gradient button)
- "▶ Watch Trailer" ghost button
- Auto-advance every 4 seconds
- Carousel dot indicators + swipe on mobile
- Images: TMDB backdrop URLs or Unsplash (seeded)

**Content Sections (horizontal scroll rails):**
- "Movies — Now Showing" (city-filtered)
- "Coming Soon"
- "Live Events & Concerts"
- "Plays"
- "Sports"
- "Activities" (workshops, exhibitions)
- "Stand-Up Comedy"

**TATA IPL 2026 Strip:**
- Full-width promotional banner
- Stadium background, team logos row (GT, MI, RCB, CSK, RR, KKR, SRH, DC)
- "Book IPL Tickets →" gold CTA
- Distinct premium styling — feels different from movie rails
- Links to `/ipl` page

**Promotional Strip:**
- Offers/announcements banner
- Admin-managed via CMS

**Footer:**
- About | Careers | List Your Show | Contact | T&C | Privacy | FAQ | Sitemap
- Social icons, © 2026 BookKaroo Pvt Ltd
- GST disclaimer line

---

### 4.5 Movies Module

#### Listing Page `/movies`

**Filters (multi-select):**
- **Languages:** Hindi, English, Tamil, Telugu, Malayalam, Kannada, Marathi, Bengali, Punjabi, Gujarati
- **Genres:** Action, Comedy, Drama, Romance, Thriller, Horror, Sci-Fi, Animation, Documentary, Biography, Musical
- **Formats:** 2D, 3D, IMAX, 4DX, Dolby Cinema
- **Categories:** Now Showing, Coming Soon, Exclusive, Premieres

**Sort:** Popularity, Release Date, Rating, A-Z

**Display:**
- Grid view: poster (2:3 ratio) + title + rating + language chips
- Hover: scale 1.04 + crimson glow + "Book Now" overlay
- Active filters shown as dismissible chips with "Clear all"
- Empty state: illustration + "No movies match your filters"
- Pagination: 20 per page, numbered

#### Movie Detail Page `/movies/:slug`

**Hero Section:**
- Full-bleed backdrop banner (blurred, dark overlay)
- Poster (sharp, left side, 2:3 ratio)
- Right side: title (Playfair Display 42px), certificate badge (U/UA/A), duration, release date
- Genre tags, language chips, format chips
- Rating: IMDb-style large number "/10" + star graphic + vote count
- "🎟 Book Tickets" large crimson CTA
- "Remind Me" bell button for Coming Soon movies

**Sticky "Book Tickets" bar:**
- Appears when hero CTA scrolls out of view
- Shows: title, format tabs, Book Tickets button

**Tabs:** About | Cast & Crew | Reviews | Photos

**About Tab:**
- YouTube trailer embed (lazy loaded, custom play button overlay)
- Film description / synopsis
- Production house, music director, other crew details

**Cast & Crew:**
- Horizontal scroll carousel
- Circular actor photos + name + role label
- Sourced from TMDB API

**Reviews & Ratings:**
- Overall score ring (SVG circular, large)
- Rating distribution bars (1-10)
- Sort: Most Helpful | Most Recent | Highest | Lowest
- Review cards: user avatar, name, Verified Booking badge (green, if user booked this movie), date, rating stars (1-10), title, body text, thumbs up/down counts
- "Write a Review" section: only shown to users who have a confirmed booking for this movie
- Rating input: 1-10 tap selector
- Review text: optional
- Guest users: can view reviews, cannot write
- Reviews paginated (10 per page)

**Photo Gallery:**
- Grid of stills/production photos

**"Remind Me" Feature (Coming Soon movies):**
- User clicks "Remind Me" → stored in `remind_me` table
- When admin changes movie status from `coming_soon` → `published` / `now_showing`, backend triggers email via Resend to all opted-in users
- Email subject: "🎬 {Movie Title} is now showing! Book your tickets"

---

### 4.6 Events Module

Covers: **Live Events, Concerts, Plays, Sports, Activities, Comedy, TATA IPL 2026**

Same browse/discovery pattern as Movies with category-specific pages:
- `/events` → Live Events & Concerts
- `/plays` → Theatre productions
- `/sports` → Cricket, Football, Kabaddi, other sports
- `/activities` → Workshops, Exhibitions, Kids, Adventure
- `/ipl` → TATA IPL 2026 dedicated page

**IPL 2026 Page `/ipl`:**
- Team cards (all 10 IPL teams with logos/colors)
- Match schedule (seeded: 5 matches)
- Countdown timer to next match
- Special gold + navy branding
- Reuses the same sports booking flow

**Event Detail Page `/events/:slug`:**
- Same layout pattern as Movie Detail
- Additional fields: artist lineup, age restriction, organizer details, duration
- Price tiers (Bronze/Silver/Gold/Platinum) instead of seat categories
- Single event date (no daily showtimes for most)

---

### 4.7 Showtimes Page `/movies/:slug/showtimes`

**Date Selector:**
- 7 horizontal tabs: Today + next 6 days
- Horizontal scroll on mobile

**Movie Mini-Header:**
- Small poster thumbnail + title + format chips + language chips

**Venue Cards (grouped by venue):**
- Venue name (bold) + area/locality
- Amenity badges: 🅿 Parking | 🍿 Food Court | 📱 M-Ticket (from seeded data)
- Show time chips per show:
  - Time label (e.g., "10:00 AM", "7:30 PM")
  - Format tag (2D / 3D / IMAX)
  - Language tag
  - Availability color: green (>50% seats available) | orange (<30% available) | red (<10%) | grey strikethrough (Sold Out)
- "from ₹150" lowest price shown
- Click time chip → Seat Selection page

**Legend row:** Available | Filling Fast | Almost Full | Sold Out

**Empty state:** "No shows on this date. Try another date."

---

### 4.8 Seat Selection `/booking/:showId/seats`

**Header (sticky):**
- Movie title + format + language + date/time + venue name
- 8-minute countdown ring (SVG circular):
  - Color: green → orange (3 min remaining) → red pulsing (50 seconds remaining)
  - Center shows MM:SS
  - Urgency drives checkout speed

**Screen Indicator:**
- Curved/trapezoid shape at top of grid
- White glow edge-lit effect
- "All eyes this way" label

**Seat Grid:**
- Rendered from screen's `layout` JSON in DB
- Row labels on left (A, B, C…)
- Seat states:
  - **Available:** category color (Recliner #FFD700, Executive #4169E1, Normal #E4E4E7)
  - **Selected by me:** crimson fill + checkmark
  - **Booked:** dark grey, cursor not-allowed, opacity 0.4
  - **Locked by other user:** amber/orange (real-time via Supabase Realtime)
- Aisle gaps rendered (from layout JSON `aisleAfterCols`)
- Max 10 seats per booking
- Mobile: horizontal scroll, zoom +/- buttons

**Category Labels between row groups:**
- Color dot + category name + price per seat

**Quick Seat Count Selector:**
- Tap 1–10 to auto-select that many "best available" adjacent seats

**Real-time Updates:**
- Subscribe to Supabase Realtime channel `show:{showId}` on mount
- When another user locks/unlocks a seat → update grid immediately

**Legend bar:** Available | Selected | Booked | Locked

**Bottom Bar (sticky):**
- Selected seat chips (dismissible ×)
- Seat count + category breakdown
- Total price + convenience fee preview
- "Pay Now →" crimson gradient button (disabled if no seats selected)
- Mobile: bottom sheet, full-width button

**Seat Lock Mechanism:**
- On seat select: `INSERT` into `seat_locks` with `expires_at = now() + 8 minutes`
- PostgreSQL advisory lock (`pg_advisory_xact_lock`) prevents race condition on same seat
- Partial unique index on `(show_id, seat_label) WHERE expires_at > now()` → DB-level double-lock prevention
- Cron sweep every 60s: `DELETE FROM seat_locks WHERE expires_at < now()`
- On payment success: delete locks → create booking record
- On timeout or user cancels: delete locks
- `session_id` field supports pre-auth guest checkout

**Zustand Persist:**
- Seat selection state persisted in `sessionStorage` (survives page refresh, not tab close)
- Restores selected seats if user accidentally refreshes

---

### 4.9 Checkout — Order Summary

**Two-panel layout (desktop) / stacked (mobile)**

**Left Panel:**
- Movie poster (small) + title + format + language
- Show date | time | venue | screen name
- Selected seats + category (e.g., "EXECUTIVE — H12, H13")
- Countdown timer (smaller, 56px ring)
- Pre-filled contact: mobile + email (editable)
- T&C checkbox (mandatory before payment)

**Right Panel — Pricing Breakdown (BookMyShow-aligned model):**

| Line Item | Calculation | Notes |
|---|---|---|
| Ticket Amount | qty × seat_price | Goes to venue, not taxed by BookKaroo |
| Convenience Fee | qty × ₹59 | BookKaroo revenue. SAC code 998554 |
| Convenience Fee GST | conv_fee × 18% | CGST 9%+SGST 9% (intra-state) or IGST 18% (inter-state) |
| Offer Processing Fee | ₹15 | Only when coupon applied. SAC 997159 |
| Offer Processing Fee GST | ₹15 × 18% = ₹2.70 | Same intra/inter-state logic |
| Discount | from coupon | Applied to ticket amount |
| **Amount Payable** | sum − discount | Final amount |

**GST State of Supply Rule:**
- Place of supply = customer's state (from city → state_code)
- Company state = Gujarat (state_code 24)
- If `customer_state_code == '24'` → CGST 9% + SGST 9%
- If `customer_state_code != '24'` → IGST 18%

**Coupon Input:**
- Text field + "APPLY" button
- Validate against `coupons` table (code, active, date range, usage limits, min order, applicable cities/movies)
- Success: green checkmark + discount line appears
- Error: red border + "Invalid or expired coupon"
- When coupon applied: Offer Processing Fee row appears (₹15 + GST)

**"Proceed to Pay" Button:**
- Phase 1: Mock payment (dev/staging only)
- Phase 1.5: Razorpay integration (after Vercel deploy)
- Shows "(Test Mode)" label in Phase 1
- Idempotency: `Idempotency-Key` header on every payment create call

---

### 4.10 Payment (Phase 1 — Mock Provider)

**IPaymentProvider interface (backend):**
```
CreateOrderAsync(req) → PaymentOrder
CaptureAsync(providerOrderId) → PaymentCapture
RefundAsync(providerPaymentId, amount) → RefundResult
VerifyWebhookSignatureAsync(payload, signature) → bool
```

**MockPaymentProvider:**
- Always returns success unless `?simulateFailure=true`
- Constructor throws `InvalidOperationException` if `ASPNETCORE_ENVIRONMENT == Production` (safety guard)
- Environment variable `PAYMENT_PROVIDER=mock` activates it
- Frontend shows "Simulate Success / Simulate Failure" buttons in non-production

**Mock Payment Flow:**
1. User clicks "Proceed to Pay"
2. `POST /api/payments/order` with `Idempotency-Key` header → creates payment record `status=created`
3. Frontend shows mock checkout dialog
4. User clicks "Simulate Success"
5. `POST /api/payments/mock-capture` → `BookingService`:
   - BEGIN TRANSACTION
   - DELETE seat_locks for this show + seats
   - INSERT booking + booking_seats
   - UPDATE payments.status = 'captured', captured_at = now()
   - COMMIT
6. Fire-and-forget: generate QR → generate invoice PDF → send email via Resend
7. Return booking confirmation

**Phase 1.5 (after Vercel staging deploy):**
- Swap `MockPaymentProvider` → `RazorpayPaymentProvider`
- Same controller/service code — only infrastructure changes
- Razorpay requires verified website URL — Vercel URL (`bookkaroo.vercel.app`) satisfies this
- Methods: UPI, Card, Net Banking (all sandbox)
- Server-side payment verification on success webhook
- On failure: retry / change method

**Idempotency:**
- `Idempotency-Key` header required on `/payments/order`
- Stored in `idempotency_keys` table (TTL 24h)
- Duplicate requests return cached response

---

### 4.11 Booking Confirmation

**Booking Reference Format:** `BK-YYYYMMDD-XXXXX` (5-character random alphanumeric suffix)

**Confirmation Page `/booking/confirmed`:**

**Animated top section:**
- Green checkmark circle (animates: scale 0→bounce)
- BookKaroo logo (glow variant)
- "Booking Confirmed!" in Playfair Display, success green
- Booking ID in JetBrains Mono chip

**Ticket Card (centrepiece):**
- Premium dark card (surface gradient)
- Left + right notch cutouts (ticket perforation design)
- Dashed horizontal tear line at 45%
- TOP HALF: Movie poster + title + showtime + venue + screen + seats
- "BOOKING CONFIRMED" rubber stamp: crimson border, rotated -15°, animates in 0.8s
- BOTTOM HALF: QR code (140×140) + "SCAN AT ENTRY COUNTER"

**QR Code:**
- Encodes booking reference (e.g., `BK-20260509-WS22Q`)
- Generated server-side (using `QRCoder` NuGet package)
- Saved to Supabase Storage bucket `qr-codes/{booking_ref}.png`
- URL stored in `bookings.qr_url`

**Action Buttons:**
- "📄 Download Invoice" → downloads GST invoice PDF
- "📅 Add to Calendar" → generates `.ics` file with event details, Google Calendar link
- "💬 Share on WhatsApp" → `wa.me` link with pre-filled message including movie, date, venue, seats

**Order Summary (compact, read-only):**
- Same structure as checkout breakdown
- Booking Date | Payment Type | Confirmation # (3-column strip)

**Important Instructions:**
- Carry valid government-issued photo ID
- Cancellation policy (if show is >2 hours away, convenience fee non-refundable)
- Outside food not allowed
- Show QR at entry

---

### 4.12 Post-Booking Notifications

#### Email (via Resend)
**Trigger:** Payment captured / booking confirmed
**Subject:** `Your Tickets — {Movie Title} — {Booking Ref}`
**From:** `BookKaroo <onboarding@resend.dev>` (dev) / `tickets@bookkaroo.com` (prod, after domain verify)

**Email Structure:**
1. Header: BookKaroo logo + dark navy background
2. Confirmation banner: green ✓ + "Your booking is confirmed!" + Booking ID
3. Movie/event card: poster + title + showtime + venue + seat label + screen
4. "Open Ticket" CTA button (crimson gradient)
5. Order Summary table: Ticket Amount | Convenience Fees (base + GST) | Offer Processing Fee (if coupon) | Discount (if any) | **Amount Paid**
6. Meta strip: Booking Date | Payment Type | Confirmation #
7. Important Instructions (bullet list)
8. Footer: Help Centre link | GST line | © 2026 BookKaroo Pvt Ltd

**Attachment:** `{booking_ref}_GST_Invoice.pdf`

#### GST Invoice PDF (via QuestPDF)
**Format:** A4 portrait, GST-compliant, single page

**Sections:**
1. Header: "Invoice" (left) + BookKaroo logo (right)
2. Left block: Invoice Number (TIN format), Date of issue, Place of supply, Booking ID, Customer GSTIN (optional), State Code, Customer Name, Customer Email
3. Right block: Company details (BookKaroo Pvt Ltd, GSTIN placeholder, PAN, State 24-Gujarat, Address)
4. Line items table: Product Description | SAC Code | Qty | Price | Discount | Taxable Amount | CGST | SGST | IGST | UT/Cess | Total
   - Row 1: "{Movie} Convenience fee/internet handling fee/delivery fee" | SAC 998554 | qty | 59.00 | 0 | taxable | CGST% | CGST amt | SGST% | SGST amt | IGST% | IGST amt | 0 | 0 | total
   - Row 2 (if coupon): "Offer Processing Fee" | SAC 997159 | 0 | 0 | 0 | 15.00 | ... | total
5. Tax summary (right-aligned): Total before tax | CGST | SGST | IGST | UGST/Cess | Total GST | **Total after tax**
6. Amount in words (Indian numbering: lakh/crore)
7. Note: "Value of Rs.X pertains to services provided by Theatre/Cinema Owner: {venue_name}"
8. Payment Reference: Transaction ID | Date & Time | Mode of payment
9. "Certified that particulars are true and correct. For BookKaroo Pvt Ltd. Authorised signatory."

**Company details (placeholder for demo):**
- Name: BookKaroo Pvt Ltd | GSTIN: 24XXXXX0000X1Z5 (placeholder)
- State: Gujarat | State code: 24 | PAN: XXXXX0000X
- Address: 701, Demo Tower, SG Highway, Bodakdev, Ahmedabad, Gujarat 380054

**Tax logic:**
- Taxable = convenience fee + offer processing fee (ticket price excluded — venue's revenue)
- If customer state = Gujarat (24) → CGST 9% + SGST 9%
- If customer state ≠ Gujarat → IGST 18%
- All rates admin-configurable via `settings` table

#### WhatsApp (via wa.me)
**Trigger:** User clicks "Share on WhatsApp" on confirmation page
**Not automated push** — user-initiated link
```javascript
const msg = `🎬 *BookKaroo Booking Confirmed!*\n\n` +
  `*Movie:* ${movie_title}\n` +
  `*Date:* ${show_date}\n` +
  `*Time:* ${show_time}\n` +
  `*Venue:* ${venue_name}\n` +
  `*Seats:* ${seat_labels}\n` +
  `*Booking ID:* ${booking_ref}\n\n` +
  `View ticket: https://bookkaroo.com/bookings/${booking_ref}`;
window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
```

#### Google Calendar
**Trigger:** User clicks "Add to Calendar" on confirmation page
- Generate `.ics` file download
- Google Calendar link: `calendar.google.com/calendar/render?action=TEMPLATE&...`
- Title: `🎬 {Movie Title} at {Venue Name}`
- Description: Booking ID, seats, venue address
- Start/end: show datetime + duration

---

### 4.13 My Bookings `/profile/bookings`

**Profile Header:**
- Avatar (initial letter, gradient circle)
- Name + email + member since date
- Stats: Total Bookings | Upcoming | Total Spent

**Tabs:** Upcoming | Past

**Booking Cards:**
- Movie poster (small, 60px, 2:3)
- Title + certificate badge
- Date | Time | Venue | Screen
- Seats in JetBrains Mono: "EXECUTIVE — H12, H13"
- Booking ID chip
- Status badge: CONFIRMED (green) | CANCELLED (crimson) | COMPLETED (grey)
- "View Ticket →" button → confirmation page
- "Cancel Booking" link (destructive, only for Upcoming Confirmed, hidden if show < 2 hours away)

**Cancel Booking:**
- Allowed only if `show_datetime > now() + 2 hours`
- Cancellation fee = convenience fee (non-refundable)
- Refund amount = amount_paid − convenience_fee_total
- Phase 1: mock refund (log refund record, no real API call)
- Phase 1.5: Razorpay refund API call (sandbox)
- Booking status → `cancelled`, `cancelled_at` = now()
- Refund status → `refunded` in payments table
- Email notification: "Your booking has been cancelled. Refund of ₹X will be processed in 7 business days."

---

### 4.14 Search

**Header search bar** (expandable on mobile):
- Global search across: movies, events, venues, cities
- Autocomplete dropdown:
  - Movie results: poster thumbnail + title + certificate + category
  - Event results: event type badge + title + date
  - Venue results: venue name + city
  - City results: city name + state
- Recent searches persisted in `localStorage` (last 5)
- Keyboard navigation (↑↓ arrows, Enter to select, Escape to close)
- Click result → navigate to detail page

**Search Results Page `/search?q=`:**
- Tabs: All | Movies | Events | Venues
- Filter sidebar (same as Movies listing)
- Empty state: magnifying glass illustration + "Nothing found for '{query}'" + suggestions

---

### 4.15 Help & Support

- **FAQ Page `/help/faq`:** Accordion-style Q&A, seeded with 10-15 common questions
- **Contact Form `/help/contact`:** Name, email, subject, message + submit
- **Booking Help:** Each booking card has "Need Help?" link → opens contact form pre-filled with booking ID

---

### 4.16 Admin Panel `/admin`

**Layout:** Sidebar (240px) + main content. Sidebar collapses to icons on mobile.

**Sidebar Navigation:**
- BookKaroo logo (smaller)
- Dashboard | Movies | Events | Venues | Shows | Bookings | Users | Reports | CMS | Settings
- Each with lucide-react icon
- Active state: crimson pill background
- Bottom: logged-in user info + logout

#### Dashboard `/admin`
- Page title + current date + "Welcome back, Admin 👋"
- **KPI Cards (4):** Today's Bookings | Revenue Today | Revenue This Week | Revenue This Month | Active Users (online) | Top Booked Movie (with poster)
- **Charts:**
  - Bookings this week: bar chart (Mon–Sun)
  - Revenue by city: horizontal bar chart (top 5 cities)
- **Recent Bookings Table:** Booking ID | User | Movie | Show Time | Amount | Status | Actions (View, Cancel)
- **Recent Activity Log:** last 5 admin actions with timestamp

#### Movies Management `/admin/movies`
- Table: Title | Certificate | Status | Release Date | Languages | Actions
- Filter by status, category
- Search by title
- **Add/Edit Movie form:**
  - Title, slug (auto-generated), description, duration_min, languages (multi-select), formats (multi-select), genres (multi-select), certificate, release_date, poster_url, backdrop_url, trailer_url, imdb_rating
  - Status: Draft | Published | Archived
  - Category: Now Showing | Coming Soon | Exclusive | Premiere
  - Cast JSON editor (name, role, photo_url)
  - Crew JSON editor (name, role)
  - "Sync from TMDB" button: input TMDB movie ID → auto-fill all fields
- Soft delete (sets `deleted_at`)

#### Events Management `/admin/events`
- Same CRUD pattern as movies
- Additional fields: type (live_event/play/sport/activity/comedy/ipl), event_date, venue_id, duration_min, language, age_restriction, organizer (jsonb), artists (jsonb), price_tiers (jsonb)
- Status: Draft | Published | Archived

#### Venues Management `/admin/venues`
- Table: Name | Chain | City | Screens | Status | Actions
- **Add/Edit Venue form:**
  - name, slug, chain, address, city_id, latitude, longitude, amenities (multi-select chips), contact_phone, contact_email
- **Screens per venue:**
  - Screen name, total_seats
  - Layout JSON editor: `{ rows, cols, categories[], blockedSeats[], aisleAfterCols[] }`
  - Category example: `{ name: "Recliner", rows: ["A","B"], price: 500, color: "#FFD700" }`

#### Shows Management `/admin/shows`
- Table: Movie/Event | Venue | Screen | Date | Time | Format | Language | Status | Actions
- **Create Show form:** movie_id (or event_id), screen_id, show_date, show_time, format, language, price_overrides (optional)
- **Cancel Show:** sets status → `cancelled`, triggers notification to affected bookings
- Filter by venue, movie, date range, status

#### Bookings Management `/admin/bookings`
- Table: Booking Ref | User | Movie/Event | Show | Seats | Amount | Status | Date | Actions
- Filters: status, city, movie, date range
- Search by booking ref or user email
- **View booking detail:** full breakdown, payment info, invoice download
- **Cancel booking:** admin-initiated (no time restriction)
- **Process refund:** Phase 1 mock, Phase 1.5 Razorpay

#### Users Management `/admin/users`
- Table: Name | Email | Mobile | City | Role | Status | Joined | Actions
- Search by name/email/mobile
- Filter by role, status (active/blocked)
- **View user profile:** full details + booking history
- **Block/Unblock user:** sets `is_blocked` flag
- **Reset password:** sends reset email via Resend

#### Reports `/admin/reports`
- **Booking Report:** filter by movie, venue, city, date range → table + totals
- **Revenue Report:** gross | net (after refunds) | GST collected
- **User Acquisition:** new users per day/week/month
- **Export:** CSV + Excel (both formats)

#### CMS `/admin/cms`
- **Home Banners:** CRUD, position ordering (drag or number input), starts_at/ends_at scheduling
- **Static Pages:** T&C, Privacy Policy, FAQ — rich text editor or markdown

#### Settings `/admin/settings`
- Key-value pairs editable via form:
  - `convenience_fee_per_ticket` (₹59 default)
  - `offer_processing_fee` (₹15 default)
  - `gst_rate` (0.18)
  - `company_state_code` (24 — Gujarat)
  - `company_gstin`, `company_pan`, `company_name`, `company_address_*`
  - `cancellation_window_hours` (2)
  - `refund_processing_days` (7)
  - `payment_provider` (mock/razorpay)
  - `max_seats_per_booking` (10)
  - `seat_lock_minutes` (8)
  - `sac_code_convenience` (998554)
  - `sac_code_offer` (997159)
  - `support_email`
  - `cancellation_policy` (text)

---

### 4.17 Notifications (Phase 1)

| Trigger | Channel | Recipient |
|---|---|---|
| Booking confirmed | Email (Resend) + WhatsApp link | Customer |
| Booking cancelled (by user or admin) | Email | Customer |
| Coming Soon → Now Showing (admin action) | Email | All users who clicked "Remind Me" |
| Password reset | Email | User |
| Welcome / email verify | Email | New user |

---

## 5. UI/UX Requirements

**Design Philosophy:** Cinematic, premium, minimal yet rich, emotionally engaging. Designed as if by a world-class agency.

**Visual Style:**
- Dark-first theme (primary), light mode available
- Deep dark backgrounds (#0A0E1A navy base)
- Rich rose accent (#E11D74)
- Purple/indigo gradients (#6366F1 → #A855F7)
- Elegant white/light typography
- Soft neon highlights
- Glassmorphism cards (backdrop-blur + subtle borders)
- Premium shadows, not flat

**Typography:**
- Display/Titles: Playfair Display (serif) — movie titles, hero headings
- UI/Body: Sora or Inter — all UI text
- Codes/References: JetBrains Mono — booking IDs, seat labels

**Motion:**
- Skeleton loaders on EVERYTHING that fetches data (not spinners)
- Smooth page transitions (fade-up stagger)
- Hover: scale 1.02–1.04 + shadow shift (150ms ease-out)
- Modal/sheet enter: 220ms ease-out
- Countdown ring: smooth dash-offset animation
- "Booking Confirmed" stamp: scale 2→1 bounce at 800ms delay
- Confetti particles on confirmation screen

**Responsive Breakpoints:** 360px | 768px | 1024px | 1440px (mobile-first)

**Mobile-Specific Patterns:**
- Modals → bottom sheets (drag handle)
- Filters → full-screen sheet
- City selector → full-screen search modal
- Seat grid → horizontal scroll + zoom buttons
- Bottom sticky bars for CTAs

**Accessibility (WCAG 2.1 AA):**
- All interactive elements: visible focus ring (2px, 2px offset, indigo)
- Semantic HTML throughout
- ARIA labels on icon-only buttons
- Seat grid: keyboard navigable (arrow keys)
- No color-only state indicators (always icon + text + color)
- Alt text on all images
- Color contrast ratio ≥ 4.5:1

**Loading States:**
- Skeleton screen: shimmer animation, matches exact shape of content
- Never use full-page spinners
- Show skeleton immediately on navigation

**Empty States:**
- Always: illustration + descriptive message + action CTA
- Never: just "No data" or blank space

**Error States:**
- Toast notifications: bottom-right desktop, bottom-center mobile
- Auto-dismiss 4 seconds, manual ×
- Types: success (green), error (red), info (blue)

---

## 6. Technical Architecture

### Backend Structure
```
BookKaroo.Api           ← Controllers, middleware, Program.cs
BookKaroo.Application   ← Services, DTOs, validators, interfaces
BookKaroo.Domain        ← Entities, enums, value objects
BookKaroo.Infrastructure ← EF Core, repositories, Resend, TMDB, QuestPDF, Supabase Storage, IPaymentProvider implementations
BookKaroo.Tests         ← xUnit + Moq + FluentAssertions
```

### Frontend Structure
```
src/
├── app/              ← Router, providers, global error boundary
├── features/         ← Feature modules (self-contained)
│   ├── auth/         ← signup, login, forgot password
│   ├── movies/       ← listing, detail, showtimes
│   ├── events/       ← listing, detail (events/sports/plays/ipl)
│   ├── booking/      ← seat selection, checkout, confirmation
│   ├── profile/      ← my bookings, profile edit
│   └── admin/        ← all admin screens
└── shared/           ← Components, hooks, lib, types, constants
```

### Payment Provider Abstraction
```csharp
public interface IPaymentProvider {
  string ProviderName { get; }
  Task<PaymentOrder> CreateOrderAsync(CreateOrderRequest req, CancellationToken ct);
  Task<PaymentCapture> CaptureAsync(string providerOrderId, CancellationToken ct);
  Task<RefundResult> RefundAsync(string providerPaymentId, decimal amount, CancellationToken ct);
}
// Implementations: MockPaymentProvider | RazorpayPaymentProvider | PayPalPaymentProvider
// Selected via PAYMENT_PROVIDER env var
// MockPaymentProvider throws in Production (safety guard)
```

### Real-time Seat Updates
- Supabase Realtime channel per show: `show:{showId}`
- Frontend subscribes on mount, unsubscribes on unmount
- Events: `seat_locked` | `seat_unlocked` | `seat_booked`
- Backend publishes after DB write

### Seat Lock Race Prevention
1. `pg_advisory_xact_lock(hashtext(show_id || seat_label))` inside transaction
2. Check: seat not in `booking_seats` (confirmed booking) AND not in `seat_locks` (active lock)
3. If clear: INSERT lock → COMMIT → publish Realtime event
4. If conflict: return 409 Conflict

### Caching Strategy (TanStack Query)
- Movies list: `staleTime` 5 minutes
- Movie detail: 10 minutes
- Showtimes: 1 minute
- Seat states: 0 (always fresh from Realtime)
- User profile: until manual invalidation

### Code Splitting
```typescript
// Every route lazy-loaded:
const MoviesPage = lazy(() => import('@/features/movies/pages/MoviesPage'));
const SeatSelectionPage = lazy(() => import('@/features/booking/pages/SeatSelectionPage'));
// etc.
```

---

## 7. Non-Functional Requirements

### Performance
- LCP < 2 seconds
- API p95: < 300ms (cached endpoints), < 800ms (DB queries)
- CDN for static assets (Vercel edge)
- Code splitting per route (reduces initial bundle ~60%)
- Image lazy loading, webp format, srcset
- Lighthouse: Performance ≥ 85, Accessibility ≥ 95

### Security
- BCrypt password hashing (cost 12)
- JWT short-lived (15 min) + httpOnly refresh token (30 days)
- Rate limiting: auth 10/min, payments 30/min, all others 100/min
- Parameterized queries only (EF Core handles this)
- CORS: explicit allowed origins, no wildcard
- HTTPS enforced in production
- No secrets in frontend code (all via VITE_ env vars)
- `MockPaymentProvider` blocked in production environment

### Reliability
- Retry with exponential backoff on external API calls (TMDB, Resend)
- Idempotency keys on payment create
- Cron job for seat lock sweep (every 60s)
- Health check endpoint: `GET /health`

### SEO
- Meta tags: title, description, og:title, og:image on movie/event pages
- Semantic HTML (h1, h2, nav, main, section, article, footer)
- Sitemap.xml (auto-generated or static)
- robots.txt

### Deployment
- Frontend: Vercel (auto-deploy on `main` push)
- Backend: Render (single .NET service, Docker)
- Database: Supabase (managed Postgres + Realtime + Storage)
- Cron: in-process background service (`SeatLockSweepService`) — no external cron needed

---

## 8. Git Workflow

**Branch strategy:**
```
master      ← default branch, always deployable
feat/*      ← one branch per feature
fix/*       ← bug fixes
chore/*     ← tooling, deps
```

**Commit format (Conventional Commits):**
```
feat(movies): add filter sidebar with multi-select
fix(booking): prevent seat double-lock under concurrent requests
chore(deps): bump dotnet to 8.0.4
```

**PR flow:** branch → commit → push → PR to `master` → tests pass → squash-merge → tag releases

Full details: [GIT-WORKFLOW.md](GIT-WORKFLOW.md)

---

## 9. QA Requirements

Per feature, test:
- Frontend: component behavior, loading/error/empty states, responsive layout
- Backend: service logic (unit), repository (integration with Testcontainers), API endpoints
- Authentication: all auth flows, token expiry, refresh rotation
- Database: query correctness, index usage, seat lock under concurrency
- Performance: Lighthouse audit, API response times
- Responsiveness: 360px, 768px, 1024px, 1440px
- Accessibility: WCAG 2.1 AA (focus, ARIA, keyboard, contrast)
- Security: auth bypasses, rate limits, SQL injection (EF parameterized), XSS
- SEO: meta tags, semantic HTML, sitemap
- Edge cases: seat lock expiry during checkout, payment failure, double-booking attempt, coupon reuse, network timeout

**Coverage target:** ≥ 70% on services and critical frontend paths
**Test tools:** xUnit + Moq + FluentAssertions (backend) | Vitest + React Testing Library + MSW (frontend)

---

## 10. Database Summary

**Tables (17):**
`settings` | `cities` | `users` | `password_reset_tokens` | `venues` | `screens` | `movies` | `events` | `shows` | `seat_locks` | `coupons` | `bookings` | `booking_seats` | `payments` | `reviews` | `notifications` | `cms_banners` | `audit_logs` | `idempotency_keys` | `remind_me` | `coupon_usages`

**All tables include:** `id (uuid PK)`, `created_at`, `updated_at`, `deleted_at` (where applicable)
**No foreign keys** — all references are UUID columns with indexes
**Storage buckets:** `qr-codes` (public), `invoices` (private), `posters` (public)

**Seed data:**
- 25 cities (with state codes)
- 5 venues, 12 screens (with layout JSON)
- 20 movies (from TMDB)
- 10 events (5 IPL + 2 concerts + 2 plays + 1 comedy)
- ~170 shows (7 days × 12 screens × 2-5 shows/day)
- 5 coupons (FIRSTBOOK, MOVIE20, KGF450, CHEAPTUE, AHMDVIBE)
- 5 CMS banners
- 30 settings keys (company details, GST rates, fees)
- 6 users (1 admin + 5 test users)

---

## 11. Pricing & Business Logic

**Convenience Fee:** ₹59 per ticket (admin-configurable)
**Offer Processing Fee:** ₹15 (only when coupon applied, admin-configurable)
**GST:** 18% on convenience + offer fees only (ticket price is venue revenue, not BookKaroo's)
**Cancellation:** Convenience fee non-refundable; ticket amount refunded
**Cancellation window:** >2 hours before show (admin-configurable)
**Refund timeline:** 7 business days (shown in UI and email)

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Seat double-booking | Advisory locks + unique partial index + DB transaction + load test (100 concurrent users) |
| Mock payment leaks to production | Constructor guard in MockPaymentProvider + integration test |
| GST calculation errors | Unit tests for intra/inter-state matrix + settings-driven (admin-fixable without redeploy) |
| Orphan rows (no FKs) | Service-layer existence checks + nightly integrity check job |
| Scope creep | Strict Phase 1 scope; all additions go to Phase 2 backlog |
| Context loss during development | HANDOFF.md generated at 80% context |
| Razorpay signup requires verified URL | Deferred to Phase 1.5 after Vercel deploy; Mock provider covers MVP |
| TMDB rate limits (40 req/10s) | Bulk sync at seed time + cache poster URLs in DB; don't call on every request |

---

## 13. Out of Scope (Phase 2)

The following are explicitly deferred to Phase 2:
- Social login (Google/Facebook via Firebase)
- Saved payment cards (Razorpay tokenization)
- F&B / merchandise add-ons
- Advanced offers engine (bank/wallet/BOGO offers)
- Wishlist / favorites
- In-app notification center
- Push notifications (1d/1h before show reminders)
- Venue partner portal
- Visual seat layout editor (drag-drop)
- Bulk CSV movie import
- Voice search
- Map view on showtimes
- Section/zone selection for events (vs numbered seats)
- Phase 2 advanced review features (spoiler warning, report review)
- Multi-language UI (Hindi/regional)
- Recommendations (personalized)

---

## 14. Glossary

| Term | Definition |
|---|---|
| Show | Scheduled screening of a movie at a specific screen, date, and time |
| Screen | Physical auditorium within a venue |
| Venue | Cinema/theatre/stadium location |
| Lock | Temporary hold on a seat during checkout (8 minutes) |
| Booking | Confirmed purchase after successful payment |
| Order | Booking + payment combined transaction |
| Seat of Supply | Customer's state — determines CGST/SGST vs IGST |
| SAC Code | Service Accounting Code — GST classification for services |
| IPaymentProvider | Backend abstraction allowing swap between Mock/Razorpay/PayPal |
| Remind Me | User opt-in to be emailed when a Coming Soon movie goes live |
| Soft Delete | `deleted_at` timestamp set instead of hard DELETE |
| Intra-state | Customer's state == company's state (Gujarat) → CGST + SGST |
| Inter-state | Customer's state ≠ company's state → IGST |