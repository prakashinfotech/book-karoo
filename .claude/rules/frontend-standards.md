# Frontend Standards — Auto-Loaded

> Enforced on all React/TypeScript work. For patterns and examples: docs/FRONTEND.md

## Hard Rules
- No `any` — use `unknown`, narrow with type guards or zod schemas
- Functional components only — no class components
- Lazy-load ALL routes: `const X = lazy(() => import('@/features/...'))`
- Every async component has 3 states: loading skeleton → data → error with retry button
- No inline styles — Tailwind classes only
- No files > 300 lines — split into subcomponents or hooks
- `@/` alias for all internal imports (no relative `../../`)

## State Discipline
| State Type | Tool |
|-----------|------|
| Local UI (open/closed, input value) | `useState` |
| Cross-component UI (city, auth user, cart) | Zustand |
| Server data (anything from API) | TanStack Query — never duplicate in Zustand |

## Forms
- `react-hook-form` + `zod` resolver on every form
- `mode: 'onBlur'` — validate on blur AND submit
- Every error message linked with `aria-describedby`

## Component Rules
- Props typed with `interface` (not `type` unless union needed)
- Co-locate tests: `ComponentName.test.tsx` next to `ComponentName.tsx`
- Skeleton components: create `ComponentNameSkeleton.tsx` for every async component

## A11y Non-Negotiables
- Semantic HTML: `<button>`, `<nav>`, `<main>`, `<article>`, `<section>`
- ARIA labels on all icon-only buttons: `aria-label="Close"`
- Focus rings: `focus-visible:ring-2 focus-visible:ring-[#6366F1]`
- No color-only states — always pair with text or icon

## File Naming
- Components/Pages: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utils/API: `camelCase.ts`
- Types: `types.ts` (per feature folder)
- Constants: `constants.ts` (per feature folder)
- Stores: `featureStore.ts`

## Key Design Tokens
```
bg-[#0A0E1A]   page base       text-[#F4F4F5]  primary text
bg-[#131826]   card surface    text-[#A1A1AA]  secondary text
bg-[#E11D74]   rose CTA        text-[#6366F1]  indigo accent
```
Full design system: docs/DESIGN-SYSTEM.md
