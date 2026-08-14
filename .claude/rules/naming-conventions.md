# Naming Conventions — Auto-Loaded

> Complete naming reference for all layers of BookKaroo.

## Frontend (TypeScript / React)

| Type | Convention | Example |
|------|-----------|---------|
| React components | `PascalCase.tsx` | `MovieCard.tsx`, `SeatGrid.tsx` |
| Page components | `PascalCase + Page` | `MovieListPage.tsx`, `CheckoutPage.tsx` |
| Custom hooks | `use + PascalCase.ts` | `useMovies.ts`, `useShowSeats.ts` |
| API modules | `camelCase + Api.ts` | `moviesApi.ts`, `bookingApi.ts` |
| Zustand stores | `camelCase + Store.ts` | `cityStore.ts`, `authStore.ts` |
| Utility functions | `camelCase.ts` | `formatCurrency.ts`, `parseDate.ts` |
| Types file | `types.ts` | per feature folder |
| Constants file | `constants.ts` | per feature folder |
| Test files | same name + `.test` | `MovieCard.test.tsx` |
| Skeleton components | `ComponentNameSkeleton.tsx` | `MovieCardSkeleton.tsx` |

## Backend (.NET / C#)

| Type | Convention | Example |
|------|-----------|---------|
| Classes | `PascalCase` | `BookingService`, `MovieResponse` |
| Interfaces | `I + PascalCase` | `IBookingService`, `IMovieRepository` |
| Async methods | `PascalCase + Async` | `GetAllAsync`, `CreateBookingAsync` |
| Request DTOs | `Action + Resource + Request` | `CreateMovieRequest`, `UpdateShowRequest` |
| Response DTOs | `Resource + Response` | `MovieResponse`, `BookingResponse` |
| Controllers | `Resource + Controller` | `MoviesController`, `BookingsController` |
| Validators | `Request + Validator` | `CreateMovieRequestValidator` |
| Repositories | `Resource + Repository` | `MovieRepository`, `BookingRepository` |
| Custom exceptions | descriptive + `Exception` | `NotFoundException`, `ConflictException` |
| Namespaces | mirror folder path | `BookKaroo.Application.Services` |
| Files | one class per file, filename = class | `MovieService.cs` |

## Database (PostgreSQL)

| Type | Convention | Example |
|------|-----------|---------|
| Table names | `snake_case`, plural | `movies`, `seat_locks`, `bookings` |
| Column names | `snake_case` | `created_at`, `booking_ref`, `state_code` |
| Primary key | always `id` | `id uuid not null` |
| Foreign key cols | `{entity}_id` | `show_id`, `user_id`, `venue_id` |
| Timestamps | exact names | `created_at`, `updated_at`, `deleted_at` |
| Boolean columns | `is_` or `has_` prefix | `is_active`, `has_offer` |
| Indexes | `idx_{table}_{column(s)}` | `idx_bookings_user_id` |
| Migrations | `{number}_{PascalCase}` | `009_SeatLocksReplicaIdentity` |

## Git

| Type | Convention | Example |
|------|-----------|---------|
| Feature branch | `feat/<scope>` | `feat/seat-selection` |
| Fix branch | `fix/<scope>` | `fix/seat-lock-race` |
| Chore branch | `chore/<scope>` | `chore/update-deps` |
| Refactor branch | `refactor/<scope>` | `refactor/booking-service` |
| Commit format | `type(scope): subject` | `feat(booking): add seat lock countdown` |
| Commit subject | imperative, ≤72 chars, no period | `add seat lock countdown ring` |
| Commit types | `feat fix refactor chore docs test style perf` | |
| Release tags | `v{MAJOR}.{MINOR}.{PATCH}` | `v0.1.0`, `v1.0.0` |

## Environment Variables

| Layer | Convention | Example |
|-------|-----------|---------|
| Frontend (Vite) | `VITE_` prefix + SCREAMING_SNAKE | `VITE_API_URL`, `VITE_SUPABASE_URL` |
| Backend (.NET) | SCREAMING_SNAKE_CASE | `DATABASE_URL`, `JWT_SECRET` |
| Secrets | never commit — `.env` only | see `.env.example` |
