import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { PartnerRoute } from '@/features/partner/PartnerRoute';
import { LysRoute } from '@/features/lys/LysRoute';

// ── Page-shape skeleton fallback ──────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="max-w-[1280px] mx-auto px-6 py-12 space-y-6">
      <Skeleton height={56} width="40%" />
      <Skeleton height={24} width="60%" />
      <div className="grid grid-cols-4 gap-4 mt-8">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[2/3] rounded-lg" />
            <Skeleton height={14} width="80%" />
          </div>
        ))}
      </div>
    </div>
  );
}

function S(Component: React.ComponentType) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Component />
    </Suspense>
  );
}

// ── Lazy imports ──────────────────────────────────────────────────────────────
const HomePage           = lazy(() => import('@/features/home/pages/HomePage'));
const MoviesPage         = lazy(() => import('@/features/movies/pages/MoviesPage'));
const MovieDetailPage    = lazy(() => import('@/features/movies/pages/MovieDetailPage'));
const ShowtimesPage      = lazy(() => import('@/features/movies/pages/ShowtimesPage'));
const EventsPage         = lazy(() => import('@/features/events/pages/EventsPage'));
const EventDetailPage    = lazy(() => import('@/features/events/pages/EventDetailPage'));
const IplPage            = lazy(() => import('@/features/events/pages/IplPage'));
const SportsPage         = lazy(() => import('@/features/events/pages/SportsPage'));
const PlaysPage          = lazy(() => import('@/features/events/pages/PlaysPage'));
const ActivitiesPage     = lazy(() => import('@/features/events/pages/ActivitiesPage'));
const ComedyPage         = lazy(() => import('@/features/events/pages/ComedyPage'));
const SearchResultsPage  = lazy(() => import('@/features/search/pages/SearchResultsPage'));
const LoginPage          = lazy(() => import('@/features/auth/pages/LoginPage'));
const SignupPage          = lazy(() => import('@/features/auth/pages/SignupPage'));
const ForgotPasswordPage  = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage   = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));
const HelpPage           = lazy(() => import('@/features/help/pages/HelpPage'));
const FaqPage            = lazy(() => import('@/features/help/pages/FaqPage'));
// Protected
const SeatSelectionPage  = lazy(() => import('@/features/booking/pages/SeatSelectionPage'));
const CheckoutPage       = lazy(() => import('@/features/booking/pages/CheckoutPage'));
const EventCheckoutPage  = lazy(() => import('@/features/booking/pages/EventCheckoutPage'));
const ConfirmationPage   = lazy(() => import('@/features/booking/pages/ConfirmationPage'));
const ProfilePage        = lazy(() => import('@/features/profile/pages/ProfilePage'));
const MyBookingsPage     = lazy(() => import('@/features/profile/pages/MyBookingsPage'));
// Admin
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage'));
const AdminMoviesPage    = lazy(() => import('@/features/admin/pages/AdminMoviesPage'));
const AdminEventsPage    = lazy(() => import('@/features/admin/pages/AdminEventsPage'));
const AdminVenuesPage    = lazy(() => import('@/features/admin/pages/AdminVenuesPage'));
const AdminShowsPage     = lazy(() => import('@/features/admin/pages/AdminShowsPage'));
const AdminBookingsPage  = lazy(() => import('@/features/admin/pages/AdminBookingsPage'));
const AdminUsersPage     = lazy(() => import('@/features/admin/pages/AdminUsersPage'));
const AdminReportsPage   = lazy(() => import('@/features/admin/pages/AdminReportsPage'));
const AdminCmsPage       = lazy(() => import('@/features/admin/pages/AdminCmsPage'));
const AdminSettingsPage  = lazy(() => import('@/features/admin/pages/AdminSettingsPage'));
const AdminPartnersPage  = lazy(() => import('@/features/admin/pages/AdminPartnersPage'));
// Partner Portal
const PartnerDashboardPage        = lazy(() => import('@/features/partner/pages/PartnerDashboardPage'));
const PartnerVenuesPage           = lazy(() => import('@/features/partner/pages/PartnerVenuesPage'));
const PartnerVenueDetailPage      = lazy(() => import('@/features/partner/pages/PartnerVenueDetailPage'));
const PartnerShowsPage            = lazy(() => import('@/features/partner/pages/PartnerShowsPage'));
const PartnerBookingsPage         = lazy(() => import('@/features/partner/pages/PartnerBookingsPage'));
const PartnerReportsPage          = lazy(() => import('@/features/partner/pages/PartnerReportsPage'));
const PartnerReviewsPage          = lazy(() => import('@/features/partner/pages/PartnerReviewsPage'));
const PartnerLysSubmissionsPage   = lazy(() => import('@/features/partner/pages/PartnerLysSubmissionsPage'));
const StaticPage         = lazy(() => import('@/features/static/pages/StaticPage'));
// LYS — ListYourShow
const LysLandingPage        = lazy(() => import('@/features/lys/pages/LysLandingPage').then((m) => ({ default: m.LysLandingPage })));
const LysRegisterPage       = lazy(() => import('@/features/lys/pages/LysRegisterPage').then((m) => ({ default: m.LysRegisterPage })));
const LysMyEventsPage       = lazy(() => import('@/features/lys/pages/LysMyEventsPage').then((m) => ({ default: m.LysMyEventsPage })));
const LysCreateEventPage    = lazy(() => import('@/features/lys/pages/LysCreateEventPage').then((m) => ({ default: m.LysCreateEventPage })));
const LysProfilePage        = lazy(() => import('@/features/lys/pages/LysProfilePage').then((m) => ({ default: m.LysProfilePage })));
// Admin LYS
const AdminLysSubmissionsPage = lazy(() => import('@/features/admin/pages/AdminLysSubmissionsPage').then((m) => ({ default: m.AdminLysSubmissionsPage })));
const AdminLysOrganizersPage  = lazy(() => import('@/features/admin/pages/AdminLysOrganizersPage').then((m) => ({ default: m.AdminLysOrganizersPage })));

// ── Guards ────────────────────────────────────────────────────────────────────
function ProtectedRoute() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const location = useLocation();
  if (!isInitialized) return null;
  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" state={{ returnTo: location.pathname + location.search }} replace />;
}

function AdminRoute() {
  const { user, isAuthenticated, isInitialized } = useAuthStore();
  const location = useLocation();
  if (!isInitialized) return null;
  if (!isAuthenticated)
    return <Navigate to="/login" state={{ returnTo: location.pathname + location.search }} replace />;
  if (user?.role !== 'Admin') return <Navigate to="/" replace />;
  return <Outlet />;
}

// ── Router ────────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // Public
  { path: '/',                    element: S(HomePage) },
  { path: '/movies',              element: S(MoviesPage) },
  { path: '/movies/:slug',        element: S(MovieDetailPage) },
  { path: '/movies/:slug/showtimes', element: S(ShowtimesPage) },
  { path: '/events',              element: S(EventsPage) },
  { path: '/events/:slug',        element: S(EventDetailPage) },
  { path: '/sports',              element: S(SportsPage) },
  { path: '/plays',               element: S(PlaysPage) },
  { path: '/activities',          element: S(ActivitiesPage) },
  { path: '/comedy',              element: S(ComedyPage) },
  { path: '/ipl',                 element: S(IplPage) },
  { path: '/search',              element: S(SearchResultsPage) },
  { path: '/login',               element: S(LoginPage) },
  { path: '/signup',              element: S(SignupPage) },
  { path: '/forgot-password',     element: S(ForgotPasswordPage) },
  { path: '/reset-password',      element: S(ResetPasswordPage) },
  { path: '/help',                element: S(HelpPage) },
  { path: '/help/faq',           element: S(FaqPage) },

  // Protected
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/booking/:showId/seats',   element: S(SeatSelectionPage) },
      { path: '/booking/checkout',        element: S(CheckoutPage) },
      { path: '/booking/event-checkout',  element: S(EventCheckoutPage) },
      { path: '/booking/confirmed',       element: S(ConfirmationPage) },
      { path: '/profile',               element: S(ProfilePage) },
      { path: '/profile/bookings',      element: S(MyBookingsPage) },
    ],
  },

  // Admin
  {
    element: <AdminRoute />,
    children: [
      { path: '/admin',           element: S(AdminDashboardPage) },
      { path: '/admin/movies',    element: S(AdminMoviesPage) },
      { path: '/admin/events',    element: S(AdminEventsPage) },
      { path: '/admin/venues',    element: S(AdminVenuesPage) },
      { path: '/admin/shows',     element: S(AdminShowsPage) },
      { path: '/admin/bookings',  element: S(AdminBookingsPage) },
      { path: '/admin/users',     element: S(AdminUsersPage) },
      { path: '/admin/reports',   element: S(AdminReportsPage) },
      { path: '/admin/cms',       element: S(AdminCmsPage) },
      { path: '/admin/settings',  element: S(AdminSettingsPage) },
      { path: '/admin/partners',          element: S(AdminPartnersPage) },
      { path: '/admin/lys/submissions',   element: S(AdminLysSubmissionsPage) },
      { path: '/admin/lys/organizers',    element: S(AdminLysOrganizersPage) },
    ],
  },

  // Partner Portal
  {
    element: <PartnerRoute />,
    children: [
      { path: '/partner',                    element: S(PartnerDashboardPage) },
      { path: '/partner/venues',            element: S(PartnerVenuesPage) },
      { path: '/partner/venues/:venueId',   element: S(PartnerVenueDetailPage) },
      { path: '/partner/shows',             element: S(PartnerShowsPage) },
      { path: '/partner/bookings',  element: S(PartnerBookingsPage) },
      { path: '/partner/reports',   element: S(PartnerReportsPage) },
      { path: '/partner/reviews',   element: S(PartnerReviewsPage) },
      { path: '/partner/lys',       element: S(PartnerLysSubmissionsPage) },
    ],
  },

  // LYS — public landing + registration
  { path: '/list-your-show',          element: S(LysLandingPage) },
  { path: '/list-your-show/register', element: S(LysRegisterPage) },

  // LYS — organizer portal (auth required)
  {
    element: <LysRoute />,
    children: [
      { path: '/list-your-show/my-events',              element: S(LysMyEventsPage) },
      { path: '/list-your-show/create',                 element: S(LysCreateEventPage) },
      { path: '/list-your-show/events/:id/edit',        element: S(LysCreateEventPage) },
      { path: '/list-your-show/profile',                element: S(LysProfilePage) },
    ],
  },

  // Static pages (About, T&C, Privacy, etc.)
  { path: '/about',          element: S(StaticPage) },
  { path: '/careers',        element: S(StaticPage) },
  { path: '/blog',           element: S(StaticPage) },
  { path: '/terms',          element: S(StaticPage) },
  { path: '/privacy',        element: S(StaticPage) },
  { path: '/faq',            element: S(StaticPage) },
  { path: '/sitemap',        element: S(StaticPage) },
  { path: '/page/:slug',     element: S(StaticPage) },

  // Fallback
  { path: '*', element: <Navigate to="/" replace /> },
]);
