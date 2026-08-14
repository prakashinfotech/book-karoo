# BookKaroo — Claude Context

## Project Overview
BookKaroo is an entertainment ticket booking platform (BookMyShow-style) for the Indian market. It supports booking for movies, live events, plays, sports (including TATA IPL 2026), comedy shows, and activities across 25 seed cities.

- **Phase 1 (current):** MVP with end-user booking flow + admin panel.
- **Phase 2 (future):** Social login, recommendations, F&B add-ons, advanced offers, partner portal, multi-channel notifications.

## Tech Stack (Locked)
| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State | Zustand (UI), TanStack Query (server) |
| Routing | React Router v6 (lazy-loaded routes) |
| Forms/Validation | react-hook-form + zod |
| Animation | framer-motion |
| Backend | .NET 8 Web API (Controller → Service → Repository) |
| ORM | EF Core + Npgsql |
| Validation | FluentValidation |
| Logging | Serilog |
| Auth | JWT (HS256) + BCrypt (cost 12) |
| Database | Supabase (PostgreSQL hosted) |
| Realtime | Supabase Realtime (WebSockets) |
| Payments | Razorpay sandbox |
| Email | Resend |
| Movie Metadata | TMDB API |

## Architectural Decisions
1. **No foreign keys** — references are UUID columns with indexes; integrity enforced at service layer.
2. **3NF schema** with soft-delete (`deleted_at`) on every table.
3. **Seat locking** via `seat_locks` table + Postgres advisory locks. No Redis. Cron sweep every 60s.
4. **Real-time seat updates** via Supabase Realtime channel per show.
5. **Idempotency** on payment endpoints via `Idempotency-Key` header.
6. **Audit log** for all admin mutations.

## Conventions
- **Branches:** `feat/<scope>` | `fix/<scope>` | `chore/<scope>` | `refactor/<scope>`
- **Commits:** Conventional commits — `feat(movies): add filter sidebar`
- **Flow:** branch from `master` → PR → squash-merge back to `master` → tag releases
- **Frontend:** feature-based folder structure; no `any`; strict TS; co-locate tests
- **Backend:** async/await + CancellationToken; DTOs separate from entities; one validator per DTO
- **DB:** snake_case; UUID PKs; every table has `id, created_at, updated_at, deleted_at`

## Key Documents
- `/docs/PRD.md` — full product requirements (Phase 1 + 2)
- `/docs/ARCHITECTURE.md` — system design + diagrams
- `/docs/DATABASE.md` — schema + ERD
- `/docs/API.md` — REST endpoint contracts
- `/docs/DESIGN-SYSTEM.md` — colors, typography, spacing, components
- `/docs/GIT-WORKFLOW.md` — branching strategy
- `.claude/rules/coding-standards.md` — coding standards Claude should follow

## Don'ts
- ❌ No Angular, no Redis, no Cloudinary, no MongoDB
- ❌ No `any` in TypeScript
- ❌ No monolithic files (>300 lines = split)
- ❌ No hardcoded secrets — use `.env`
- ❌ No hard deletes — soft delete only
- ❌ No inline styles — Tailwind classes only

## Per-Session Workflow
1. Read this file + relevant `/docs/*` before starting any feature
2. Pull latest `master`, branch off
3. Implement backend → frontend → tests
4. Update `/docs/API.md` if endpoints changed
5. Commit, push, open PR

## Handoff
When context reaches ~80%, generate `/docs/HANDOFF.md` with current state, open items, and next priorities.
