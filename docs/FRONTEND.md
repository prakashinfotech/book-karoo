# BookKaroo — Frontend Developer Guide

> Patterns, folder structure, and conventions for the React 18 + TypeScript frontend.
> Auto-loaded rules: [.claude/rules/frontend-standards.md](../.claude/rules/frontend-standards.md)
> Design reference: [docs/DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)

---

## Folder Structure

```
frontend/src/
├── app/                        # App shell (configure once, rarely touch)
│   ├── router.tsx              # All routes, lazy-loaded
│   ├── providers.tsx           # QueryClient, ThemeProvider, AuthProvider, Toaster
│   └── ErrorBoundary.tsx       # Top-level error boundary
│
├── features/                   # Feature-first — one folder per domain
│   ├── auth/
│   │   ├── components/         # LoginForm.tsx, SignupForm.tsx, ForgotPasswordForm.tsx
│   │   ├── hooks/              # useLogin.ts, useSignup.ts, useAuthUser.ts
│   │   ├── pages/              # LoginPage.tsx, SignupPage.tsx
│   │   ├── store/              # authStore.ts (Zustand — user object, isAuthenticated)
│   │   ├── api/                # authApi.ts (raw fetch/axios functions)
│   │   └── types.ts            # LoginRequest, AuthUser, TokenPair
│   │
│   ├── movies/
│   │   ├── components/         # MovieCard.tsx, MovieFilters.tsx, MovieGrid.tsx
│   │   ├── hooks/              # useMovies.ts, useMovieDetail.ts
│   │   ├── pages/              # MovieListPage.tsx, MovieDetailPage.tsx
│   │   ├── api/                # moviesApi.ts
│   │   └── types.ts
│   │
│   ├── booking/                # Seat selection → checkout → confirmation
│   │   ├── components/
│   │   │   ├── SeatGrid.tsx
│   │   │   ├── CountdownRing.tsx
│   │   │   ├── CheckoutPanel.tsx
│   │   │   └── BookingConfirmation.tsx
│   │   ├── hooks/
│   │   │   ├── useShowSeats.ts     # Supabase Realtime seat state
│   │   │   ├── useSeatLock.ts      # Lock/unlock mutations
│   │   │   └── useCheckout.ts      # GST breakdown, coupon, submit
│   │   ├── pages/
│   │   │   ├── SeatSelectionPage.tsx
│   │   │   ├── CheckoutPage.tsx
│   │   │   └── ConfirmationPage.tsx
│   │   ├── store/              # bookingStore.ts (selected seats, timer state)
│   │   ├── api/                # bookingApi.ts, seatLockApi.ts, paymentApi.ts
│   │   └── types.ts
│   │
│   ├── events/                 # Same pattern as movies/ (events, plays, sports, activities, IPL)
│   ├── admin/                  # Admin panel — 13 routes (movies/events/venues/shows/bookings/users/reports/cms/settings/partners/lys), AdminRoute guard
│   ├── partner/                 # Partner portal — venue partners manage their own venues/shows/bookings, PartnerRoute guard
│   ├── lys/                    # List Your Show — organizer self-serve event submission + admin review workflow, LysRoute guard
│   ├── chatbot/                # Groq-backed AI assistant widget
│   ├── home/                   # HomePage, hero carousel, content rails
│   ├── search/                 # SearchPage, SearchBar, SearchResults
│   ├── profile/                # ProfilePage, BookingsPage, EditProfileForm
│   ├── cities/                 # City selection modal + store wiring
│   ├── help/                   # FAQ, contact form
│   └── static/                 # Static/legal pages
│
├── shared/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui component wrappers (Button, Input, etc.)
│   │   ├── layout/             # Header.tsx, Footer.tsx, PageLayout.tsx
│   │   ├── skeletons/          # MovieCardSkeleton.tsx, SeatGridSkeleton.tsx
│   │   └── feedback/           # ErrorState.tsx, EmptyState.tsx, LoadingSpinner (avoid)
│   ├── hooks/                  # useDebounce.ts, useLocalStorage.ts, useIntersection.ts
│   ├── lib/
│   │   ├── api.ts              # Axios instance, interceptors (auth header, refresh)
│   │   ├── supabase.ts         # Supabase client (Realtime + Storage)
│   │   └── utils.ts            # formatCurrency, formatDate, cn() classnames
│   ├── store/                  # cityStore.ts (selected city — persisted)
│   ├── types/                  # Global shared types (ApiError, PaginatedResponse)
│   └── constants/              # CITIES, GENRES, SEAT_CATEGORIES, ROUTES
│
└── design/                     # Legacy design-system prototype — NOT wired into the live app.
                                 # Only ThemeContext.tsx is actually imported (by app/providers.tsx);
                                 # tokens.ts, DesignSystem.tsx, Logo.tsx, and all screens/* are unused dead code.
```

---

## State Management — Decision Tree

```
Is the data fetched from the API?
  YES → TanStack Query (useQuery / useMutation). Never duplicate into Zustand.
  NO  → Is it shared across multiple unrelated components?
          YES → Zustand store
          NO  → useState (or useReducer for complex local state)
```

### TanStack Query Patterns

```typescript
// Read query
export function useMovies(filters?: MovieFilters) {
  return useQuery({
    queryKey: ['movies', filters],        // include all filter params in key
    queryFn: () => moviesApi.getAll(filters),
    staleTime: 5 * 60 * 1000,            // 5 min — stable reference data
  });
}

// Write mutation
export function useLockSeat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: seatLockApi.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seats', variables.showId] });
    },
    onError: (err) => toast.error(err.message),
  });
}
```

### Zustand Store Pattern

```typescript
// features/auth/store/authStore.ts
interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  isAuthenticated: () => get().user !== null,
}));
```

---

## Component Patterns

### Async component (required 3-state pattern)

```typescript
export function MovieList({ filters }: { filters: MovieFilters }) {
  const { data, isLoading, error, refetch } = useMovies(filters);

  if (isLoading) return <MovieListSkeleton />;
  if (error) return <ErrorState message="Failed to load movies" onRetry={refetch} />;
  if (!data?.length) return <EmptyState message="No movies match your filters" />;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {data.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
```

### Form pattern (react-hook-form + zod)

```typescript
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type LoginInput = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { mutate: login, isPending } = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',   // validate on blur AND submit (required)
  });

  return (
    <form onSubmit={handleSubmit((data) => login(data))}>
      <Input {...register('email')} aria-describedby="email-error" />
      {errors.email && <p id="email-error" role="alert">{errors.email.message}</p>}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Signing in…' : 'Sign In'}
      </Button>
    </form>
  );
}
```

---

## Routing (all routes must be lazy-loaded)

```typescript
// app/router.tsx
const HomePage = lazy(() => import('@/features/home/pages/HomePage'));
const MoviesPage = lazy(() => import('@/features/movies/pages/MoviesPage'));
const SeatSelectionPage = lazy(() => import('@/features/booking/pages/SeatSelectionPage'));
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Suspense fallback={<PageSkeleton />}><HomePage /></Suspense> },
      { path: 'movies', element: <Suspense ...><MoviesPage /></Suspense> },
      { path: 'booking/:showId/seats', element: <Suspense ...><SeatSelectionPage /></Suspense> },
    ],
  },
  {
    path: '/admin',
    element: <AdminRoute><AdminLayout /></AdminRoute>,     // checks role: 'admin' claim
    children: [/* movies, events, venues, shows, bookings, users, reports, cms, settings, partners, lys/* */],
  },
  {
    path: '/partner',
    element: <PartnerRoute><PartnerLayout /></PartnerRoute>, // checks role: 'partner' claim
    children: [/* dashboard, venues, shows, bookings, reports, reviews, lys-submissions */],
  },
  {
    path: '/lys',
    element: <LysRoute><LysLayout /></LysRoute>,            // organizer self-serve, own auth guard
    children: [/* landing, register, create-event, my-events, profile */],
  },
]);
```

Real guards: `ProtectedRoute` (booking flow — requires any authenticated user), `AdminRoute`, `PartnerRoute`, `LysRoute`. There is no single `PageLayout` wrapping every route — the public site uses `PublicLayout`, and each portal has its own layout component.

---

## Supabase Realtime — Seat Selection

```typescript
// features/booking/hooks/useShowSeats.ts
export function useShowSeats(showId: string) {
  const [lockedSeatIds, setLockedSeatIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const channel = supabase
      .channel(`show:${showId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'seat_locks', filter: `show_id=eq.${showId}` },
        (payload) => setLockedSeatIds((prev) => new Set([...prev, payload.new.seat_id]))
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'seat_locks', filter: `show_id=eq.${showId}` },
        (payload) => setLockedSeatIds((prev) => { const next = new Set(prev); next.delete(payload.old.seat_id); return next; })
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [showId]);

  return lockedSeatIds;
}
```

---

## API Client Setup

```typescript
// shared/lib/api.ts
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      await refreshAccessToken();
      return api(err.config);
    }
    return Promise.reject(err);
  }
);
```

---

## Design Tokens Quick Reference

```tsx
// Background layers
<div className="bg-[#0A0E1A]">           {/* page base */}
<div className="bg-[#131826]">           {/* cards */}
<div className="bg-[#1A2138]">           {/* elevated cards */}

// Text
<p className="text-[#F4F4F5]">           {/* primary */}
<p className="text-[#A1A1AA]">           {/* secondary */}
<p className="text-[#71717A]">           {/* muted */}

// Accents
<button className="bg-[#E11D74]">        {/* primary CTA — rose */}
<button className="bg-[#6366F1]">        {/* secondary — indigo */}

// Seat states (SeatGrid only)
available: "bg-white"
selected:  "bg-[#E11D74]"
locked:    "bg-[#F59E0B]"  (locked by someone else)
booked:    "bg-[#3F3F46]"
```

---

## Accessibility Checklist (required for every PR)

- [ ] Semantic HTML (`<button>`, `<nav>`, `<main>`, `<article>`, `<section>`)
- [ ] ARIA labels on every icon-only button: `aria-label="Close modal"`
- [ ] Error messages linked with `aria-describedby`
- [ ] Focus rings: `focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2`
- [ ] Keyboard navigation: modal closes on Esc, seat grid navigable with arrow keys
- [ ] Contrast ≥ 4.5:1 for all text (use design tokens — they are pre-checked)
- [ ] No color-only states (pair color with text or icon)
- [ ] Loading: `aria-busy="true"` on container while fetching

---

## Environment Variables

```bash
# frontend/.env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
VITE_PAYMENT_PROVIDER=mock
```

---

*Related: [docs/DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | [docs/TESTING.md](TESTING.md) | [.claude/rules/frontend-standards.md](../.claude/rules/frontend-standards.md)*
