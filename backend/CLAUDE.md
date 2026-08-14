# BookKaroo Backend — Claude Context

> Lazy-loaded when Claude reads any file inside `backend/`.
> Root `/CLAUDE.md` and `.claude/rules/coding-standards.md` are also active.

## Stack
.NET 8 Web API · EF Core 8 + Npgsql · FluentValidation · Serilog · JWT (HS256) · BCrypt · QuestPDF · Supabase (PostgreSQL)

## Solution Structure
```
backend/
├── src/
│   ├── BookKaroo.Api/           ← Controllers, Program.cs, Middleware
│   ├── BookKaroo.Application/   ← Services, DTOs, Interfaces, Validators
│   ├── BookKaroo.Domain/        ← Entities, Enums, BaseEntity
│   └── BookKaroo.Infrastructure/ ← Repositories, DbContext, ExternalServices
├── database/
│   └── migrations/              ← Numbered SQL files, run in Supabase SQL Editor
└── tests/
    └── BookKaroo.Tests/
```

## Layer Rules
- **Controller** — thin: model binding + service call + return ActionResult only
- **Service** — business logic, orchestration, inject repositories
- **Repository** — data access only, return entities (no business rules)
- **DTOs** — live in Application layer, entities never cross service boundary

## Dev
```bash
cd backend
dotnet restore
dotnet build
dotnet run --project src/BookKaroo.Api   # → http://localhost:5000
```

## Environment Variables (in launchSettings.json)
```
DATABASE_URL          postgresql://... (Supabase)
JWT_SECRET            at least 32 chars
JWT_ISSUER            bookkaroo
JWT_AUDIENCE          bookkaroo-api
CORS_ALLOWED_ORIGINS  http://localhost:5173,...
TMDB_BEARER           eyJ... (TMDB v4 Bearer token)
RESEND_API_KEY        re_...
PAYMENT_PROVIDER      mock
```

## Key Patterns
- All entities extend `BaseEntity` (Id, CreatedAt, UpdatedAt, DeletedAt)
- Soft delete only — never hard `DELETE` — use `SoftDeleteAsync(id, ct)`
- No foreign keys in DB — integrity enforced in service layer
- EF Core global query filters: `HasQueryFilter(e => e.DeletedAt == null)`
- `Task.WhenAll` is BANNED across services sharing one DbContext — use sequential await

## Database
- PostgreSQL hosted on Supabase
- Table names: `"Events"`, `"Movies"`, `"Users"` etc (double-quoted, capital first letter)
- Seed files: `backend/database/migrations/001_initial_schema.sql`, `002_seed_data.sql`, `003_seed_events.sql`
- Run seed files manually in Supabase SQL Editor

## Docker (Render deployment)
- `backend/Dockerfile` — multi-stage build, PORT from env
- Root dir on Render: `backend`
- Installs `libfontconfig1 + libfreetype6` for QuestPDF on Linux

## Known Decisions
- EF Core DbContext is NOT thread-safe — HomeController uses sequential await (not Task.WhenAll)
- `AdminService` injects `IAdminRepository` for dashboard queries (not DbContext directly)
- ParseCast / ParseCrew support both admin form fields ("role"/"photo") and TMDB API fields ("character"/"profile_path")
