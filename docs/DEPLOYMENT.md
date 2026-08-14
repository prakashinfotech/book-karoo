# BookKaroo — Deployment Guide

> Deployment: Vercel (frontend) + Render (backend, Docker) + Supabase (database).

---

## Platform Overview

| Service | Platform | Trigger |
|---------|----------|---------|
| Frontend (React/Vite) | Vercel | Auto-deploy on `main` push |
| Backend (.NET 8 API) | Render (Docker) | Auto-deploy on `main` push |
| Database | Supabase | Managed PostgreSQL |
| Realtime | Supabase | Built-in with Postgres |
| Storage | Supabase | Buckets: `qr-codes`, `invoices`, `posters` |
| Seat lock cron | In-process `SeatLockSweepService` (hosted service inside the API) | Every 60 seconds — no external cron platform needed |

---

## Frontend — Vercel

### Setup
1. Import GitHub repo in Vercel dashboard
2. Set **Root Directory** to `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Install command: `npm ci`

### Environment Variables (Vercel Dashboard)
```bash
VITE_API_URL=https://bookkaroo-api.onrender.com
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxx
VITE_PAYMENT_PROVIDER=mock
# Phase 1.5:
# VITE_RAZORPAY_KEY_ID=rzp_live_xxxx
```

### Custom Domain
- Add `bookkaroo.com` in Vercel → Domains
- Update `CORS_ALLOWED_ORIGINS` on backend to include the production URL

---

## Backend — Render

Deployed as a Docker container (`backend/Dockerfile`), not Render's native .NET buildpack.

1. New Web Service → connect GitHub repo
2. Root directory: `backend`
3. Environment: Docker (uses `backend/Dockerfile`)
4. Render injects `PORT` at runtime (default `10000`) — the app reads it
5. Health check path: `/health`
6. Plan: Starter (can upgrade for zero cold starts)

### Environment Variables (Backend)
```bash
# App
ASPNETCORE_ENVIRONMENT=Production
PORT=5000

# Database
DATABASE_URL=postgresql://postgres.xxxx:password@pooler.supabase.com:6543/postgres

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_xxxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxx
SUPABASE_STORAGE_BUCKET_QR=qr-codes
SUPABASE_STORAGE_BUCKET_INVOICE=invoices

# JWT
JWT_SECRET=<generate: openssl rand -base64 32>
JWT_ISSUER=bookkaroo
JWT_AUDIENCE=bookkaroo-api
JWT_ACCESS_TTL_MIN=15
JWT_REFRESH_TTL_DAYS=30

# Payment (Phase 1: mock — IMPORTANT: see note below)
PAYMENT_PROVIDER=mock
# Phase 1.5:
# PAYMENT_PROVIDER=razorpay
# RAZORPAY_KEY_ID=rzp_live_xxxx
# RAZORPAY_KEY_SECRET=xxxx
# RAZORPAY_WEBHOOK_SECRET=xxxx

# Email
RESEND_API_KEY=re_xxxx
RESEND_FROM=BookKaroo <noreply@bookkaroo.com>

# TMDB
TMDB_API_KEY=xxxx
TMDB_BEARER=eyJxxxx

# CORS
CORS_ALLOWED_ORIGINS=https://bookkaroo.vercel.app,https://bookkaroo.com
```

> **IMPORTANT:** `MockPaymentProvider` throws `InvalidOperationException` if `ASPNETCORE_ENVIRONMENT=Production`.
> For Phase 1 staging demo, set `ASPNETCORE_ENVIRONMENT=Staging` to allow mock payments.
> For live production with real payments, set `PAYMENT_PROVIDER=razorpay`.

---

## Database — Supabase

### Running Migrations
```bash
# Local (dev)
cd backend/src/BookKaroo.Api
dotnet ef database update --project ../BookKaroo.Infrastructure

# Production (run from local against prod DB URL)
DATABASE_URL=<prod-url> dotnet ef database update --project ../BookKaroo.Infrastructure
```

### Enable Supabase Realtime
Run in Supabase SQL editor after migrations:
```sql
ALTER TABLE seat_locks REPLICA IDENTITY FULL;
```
Then enable Realtime on `seat_locks` in Supabase Dashboard → Database → Replication.

### Create Storage Buckets
In Supabase Dashboard → Storage → New Bucket:

| Bucket | Public? | Purpose |
|--------|---------|---------|
| `qr-codes` | ✅ Public | QR code images (shared in confirmation) |
| `invoices` | ❌ Private | GST invoice PDFs (user-specific) |
| `posters` | ✅ Public | Event/movie posters (custom uploads) |

### Row Level Security (RLS)
```sql
-- Users can read their own bookings
CREATE POLICY "user_own_bookings" ON bookings
    FOR SELECT USING (user_id = auth.uid());

-- Service role bypasses RLS (backend uses service key)
-- Public can read movies/events/venues/shows
CREATE POLICY "public_movies_read" ON movies
    FOR SELECT USING (deleted_at IS NULL);
```

---

## Cron Job — Seat Lock Sweep

The `SeatLockSweepService` background service runs every 60s within the .NET app — there is no separate cron job to configure. On Render, set minimum instances to 1 so the service doesn't sleep between requests (which would pause the sweep).

The background service calls:
```sql
DELETE FROM seat_locks WHERE expires_at < NOW();
```
And releases corresponding PostgreSQL advisory locks.

---

## CI/CD with GitHub Actions (Not Yet Set Up)

No `.github/workflows/` directory exists in this repo yet — deploys currently happen via Vercel's and Render's own git-push auto-deploy, with no test gate in front of them. A starting point, once frontend testing is wired up (see `docs/TESTING.md`):

```yaml
# .github/workflows/deploy.yml
name: CI

on:
  push:
    branches: [master]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with: { dotnet-version: '8.x' }
      - run: dotnet test backend/BookKaroo.sln

  typecheck-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci && npm run typecheck

  # Vercel and Render deploy automatically on main push — this workflow only gates on tests
```

---

## Pre-Launch Checklist

### Company & Legal
- [ ] Register real GSTIN and PAN (currently placeholders in `docs/COMPANY-DETAILS.md`)
- [ ] Update all settings in admin panel (company name, GSTIN, address, state code)
- [ ] Review cancellation policy wording

### Email
- [ ] Verify domain (`bookkaroo.com`) in Resend dashboard
- [ ] Update `RESEND_FROM` to use verified domain
- [ ] Test booking confirmation email end-to-end

### Payments
- [ ] Sign up for Razorpay (requires live website URL)
- [ ] Switch `PAYMENT_PROVIDER=razorpay` with live keys
- [ ] Set `ASPNETCORE_ENVIRONMENT=Production`
- [ ] Test Razorpay webhook locally with ngrok before deploying

### Database
- [ ] Run all migrations against production DB
- [ ] Enable Realtime on `seat_locks`
- [ ] Create all 3 storage buckets with correct public/private settings
- [ ] Verify RLS policies are applied

### Frontend
- [ ] Set correct `VITE_API_URL` (production backend URL)
- [ ] Verify Lighthouse scores: ≥85 performance, ≥95 accessibility

### End-to-End Test
- [ ] Full booking flow: discover → seat selection → payment → confirmation email + invoice
- [ ] Admin login and dashboard
- [ ] Cancel booking flow
- [ ] Test with inter-state user (check IGST vs CGST+SGST)

---

*Company details: [docs/COMPANY-DETAILS.md](COMPANY-DETAILS.md) | Architecture: [docs/ARCHITECTURE.md](ARCHITECTURE.md)*
