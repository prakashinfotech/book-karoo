# BookKaroo Frontend — Claude Context

> Lazy-loaded when Claude reads any file inside `frontend/`.
> Root `/CLAUDE.md` and `.claude/rules/coding-standards.md` are also active.

## Stack
React 18 + TypeScript + Vite · Tailwind CSS · TanStack Query · Zustand · react-hook-form + zod · framer-motion · React Router v6

## Key Paths
| What | Where |
|---|---|
| Pages (lazy routes) | `src/features/<feature>/pages/` |
| Shared components | `src/shared/components/` |
| API hooks | `src/features/<feature>/api/use*.ts` |
| Global types | `src/shared/types.ts` |
| Route definitions | `src/app/router.tsx` |
| Tailwind config | `tailwind.config.ts` |
| Design tokens | `docs/DESIGN-SYSTEM.md` |

## API
- Base URL from `VITE_API_URL` env var (default `http://localhost:5000`)
- Axios instance at `src/shared/lib/api.ts` — JWT Bearer injected via interceptor
- All server state via TanStack Query — never duplicate into Zustand

## Dev
```bash
cd frontend
npm install
npm run dev        # Vite dev server → http://localhost:5173
npm run typecheck  # tsc --noEmit (must pass before committing)
npm run build      # production build
```

## Environment Variables (frontend/.env)
```
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://[ref].supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_PAYMENT_PROVIDER=mock
```

## Conventions
- Feature-based folder structure: `src/features/<feature>/{api,components,pages,types.ts}`
- No `any` — use `unknown` + narrow
- Components > 300 lines → split
- Every route lazy-loaded with `lazy(() => import(...))`
- Dark mode via Tailwind CSS class — tokens in `bg-bg-base`, `text-text-primary`, etc.
- `cn()` from `@/shared/lib/utils` for conditional classNames

## Known Issues / Notes
- `withCredentials` removed from Axios — JWT Bearer only (no cookie auth)
- CORS_ALLOWED_ORIGINS must include Vercel URL for deployed frontend
- `@tailwindcss/oxide-win32-x64-msvc` must NOT be in package.json dependencies
