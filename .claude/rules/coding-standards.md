# BookKaroo — Coding Standards
> Auto-loaded by Claude Code from `.claude/rules/`. Previously SKILLS.md.

## React / TypeScript
- **Functional components only.** No class components.
- **Hooks discipline:** custom hooks (`useX`) for any reused logic. Naming: `useAuth`, `useDebounce`, `useShowSeats`.
- **Strict TS:** `"strict": true`, `"noImplicitAny": true`. `any` is banned — use `unknown` and narrow.
- **Props typed via `interface`**, not `type` (unless union).
- **Components file = one component + its tests + types co-located.**
- **Lazy load every route**: `const X = lazy(() => import('@/features/x/pages/XPage'))`.
- **State separation:**
  - UI/local state → `useState`
  - Cross-component UI state → Zustand
  - Server state → TanStack Query (never duplicate into Zustand)
- **Forms:** `react-hook-form` + `zod` resolver. Always validate on submit AND on blur.
- **Errors:** every async UI shows loading skeleton → success state → error state with retry.
- **A11y:** semantic HTML, ARIA labels on icon buttons, focus rings, keyboard nav, contrast ≥ 4.5:1.

## File Naming (Frontend)
- Components: `PascalCase.tsx` (e.g., `MovieCard.tsx`)
- Hooks: `useCamelCase.ts`
- Utilities: `camelCase.ts`
- Types: `types.ts` per feature folder
- Constants: `constants.ts` per feature folder

## .NET / C#
- **Layering (strict):** Controller → Service → Repository → DbContext.
- **Controllers:** thin — only model binding + service call + return ActionResult. No business logic.
- **Services:** business logic, transactions, orchestration. Inject repositories.
- **Repositories:** data access only — no business rules. Return entities or DTOs.
- **DTOs:** in `Application` layer. Entities never leave the service boundary.
- **Async everywhere:** `async Task<T>` + `CancellationToken` parameter on every async method.
- **Validation:** FluentValidation per DTO; auto-registered in DI; runs in middleware.
- **Logging:** Serilog structured logs. No string concatenation.
- **Errors:** custom exceptions (`NotFoundException`, `ValidationException`, `ConflictException`) → global middleware → ProblemDetails response.
- **Naming:** Interfaces `IUserService`, Async methods end with `Async`, DTOs `CreateUserRequest`/`UserResponse`.

## File Naming (Backend)
- One class per file. File name = class name. Folder structure mirrors namespace.

## Database
- All tables: `id (uuid)`, `created_at`, `updated_at`, `deleted_at (null)`
- snake_case columns, plural table names
- No FKs — integrity enforced in service layer
- Money in `numeric(10,2)`, never `float`
- Migrations: numbered, idempotent, in `/backend/database/migrations/`

## Git
- **Conventional commits:** `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`, `perf`
- Format: `<type>(<scope>): <subject>` — subject imperative, ≤ 72 chars, no period
- One logical change per commit

## Testing
- **Backend:** xUnit + Moq + FluentAssertions. AAA pattern. Mock repositories.
- **Frontend:** Vitest + React Testing Library. Test user behavior. Mock API via MSW.
- **Coverage target:** ≥ 70% on services and reducers.

## Security
- BCrypt cost 12. JWT 15min access + 30d refresh (httpOnly cookie).
- Rate limit `/auth/*`. Sanitize HTML. CORS explicit origins. Params via EF Core only.

## Don'ts
- ❌ No `any`, no monolithic files (>300 lines), no hard deletes, no inline styles, no FKs, no Redis
