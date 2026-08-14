# Backend Standards — Auto-Loaded

> Enforced on all .NET 8 work. For patterns and examples: docs/BACKEND.md

## Hard Rules
- Strict layering: Controller → Service → Repository → DbContext (no skipping)
- Controllers are THIN — model bind + service call + return ActionResult only. Zero business logic.
- `async Task<T>` + `CancellationToken` on every async method, no exceptions
- DTOs never leave the service boundary — entities stay in Application/Infrastructure
- FluentValidation for every request DTO — auto-registered, runs as middleware
- Serilog structured logs — no string concatenation ever
- No files > 300 lines — split into partial classes or separate services
- `decimal` in C#, `numeric(10,2)` in DB for money — never float/double

## Exception Types (throw these in services)
```
NotFoundException      → 404   (entity not found by ID)
ConflictException      → 409   (seat already locked, duplicate resource)
ValidationException    → 422   (business rule violation, not FluentValidation)
UnauthorizedException  → 401
ForbiddenException     → 403
```
GlobalExceptionMiddleware maps all of these to ProblemDetails automatically.

## Database Rules
- All tables: `id (uuid PK)`, `created_at`, `updated_at`, `deleted_at (null)`
- Always filter deleted: EF global query filter handles `WHERE deleted_at IS NULL`
- No FK constraints — reference by UUID column + index only
- Check referenced entity existence in service layer (not DB constraint)
- snake_case table/column names, plural table names

## Naming
- Interfaces: `IUserService`, `IMovieRepository`
- Async methods: `GetAllAsync`, `CreateAsync`, `DeleteAsync`
- Request DTOs: `CreateMovieRequest`, `UpdateVenueRequest`
- Response DTOs: `MovieResponse`, `BookingResponse`
- Validators: `CreateMovieRequestValidator`

## Security
- BCrypt cost 12 for all passwords
- JWT: 15min access, 30d refresh (httpOnly cookie)
- Rate limit `/auth/*`: 10 req/min/IP
- EF Core parameters only — never raw SQL with user input

## Migrations
```bash
cd backend/src/BookKaroo.Api
dotnet ef migrations add <Name> --project ../BookKaroo.Infrastructure
dotnet ef database update
```
Naming: sequential prefix `010_AddNewFeature`
