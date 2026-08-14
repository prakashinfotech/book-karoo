import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Clock, Ticket, BarChart2, Star,
  LogOut, Menu, X, Home, CalendarCheck,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useAuthStore } from '@/features/auth/store/authStore';
import { usePartnerLysPendingCount } from '../api/usePartnerLys';

const NAV = [
  { label: 'Dashboard',         icon: LayoutDashboard, href: '/partner' },
  { label: 'My Venues',         icon: Building2,       href: '/partner/venues' },
  { label: 'Shows',             icon: Clock,           href: '/partner/shows' },
  { label: 'Bookings',          icon: Ticket,          href: '/partner/bookings' },
  { label: 'Reports',           icon: BarChart2,       href: '/partner/reports' },
  { label: 'Reviews',           icon: Star,            href: '/partner/reviews' },
  { label: 'Event Submissions', icon: CalendarCheck,   href: '/partner/lys' },
] as const;

export function PartnerLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: pendingCount } = usePartnerLysPendingCount();

  // Close mobile nav on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  function handleLogout() {
    clearAuth();
    navigate('/');
  }

  const venueNames  = user?.partnerVenueNames ?? [];
  const showLabel   = !collapsed || mobileOpen;

  return (
    <div className="flex min-h-screen bg-bg-surface font-sans">

      {/* ── Mobile top bar (hidden on md+) ─────────────────────────────── */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-bg-base border-b border-border-default flex items-center px-4 z-40">
        <span className="font-display font-bold text-base text-text-primary">
          Book<span className="text-accent-crimson">Karoo</span>
          <span className="text-accent-indigo text-xs ml-1.5 font-sans font-normal">Partner</span>
        </span>
        {(pendingCount ?? 0) > 0 && (
          <span className="ml-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-accent-crimson text-white text-[10px] font-bold px-1">
            {(pendingCount ?? 0) > 99 ? '99+' : pendingCount}
          </span>
        )}
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          className="ml-auto text-text-muted hover:text-text-primary p-1.5 rounded"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* ── Backdrop (mobile only) ──────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      {/*
        Mobile  : fixed overlay, slides in from left, z-50
        Desktop : relative flex-child, collapsible width, always visible
      */}
      <aside
        className={cn(
          'flex flex-col flex-shrink-0 bg-bg-base border-r border-border-default z-50',
          // Mobile: fixed overlay
          'fixed inset-y-0 left-0 w-[260px]',
          'transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: back to in-flow, no transform, collapsible width
          'md:relative md:translate-x-0',
          'md:transition-[width] md:duration-[220ms]',
          collapsed ? 'md:w-[60px]' : 'md:w-[240px]',
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border-default flex-shrink-0">
          {showLabel && (
            <span className="font-display font-bold text-base text-text-primary truncate">
              Book<span className="text-accent-crimson">Karoo</span>
              <span className="text-accent-indigo text-xs ml-1.5 font-sans font-normal">Partner</span>
            </span>
          )}
          {/* Mobile: X to close; Desktop: toggle collapse */}
          <button
            onClick={() => mobileOpen ? setMobileOpen(false) : setCollapsed(!collapsed)}
            aria-label={mobileOpen ? 'Close menu' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="ml-auto text-text-muted hover:text-text-primary p-1 rounded flex-shrink-0"
          >
            {mobileOpen ? <X size={18} /> : collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>

        {/* Nav — scrollable to handle overflow */}
        <nav className="py-3 px-2 space-y-0.5 overflow-y-auto flex-1">
          {NAV.map(({ label, icon: Icon, href }) => {
            const active = href === '/partner' ? pathname === href : pathname.startsWith(href);
            const isLys  = href === '/partner/lys';
            const badge  = isLys && (pendingCount ?? 0) > 0 ? pendingCount : null;
            return (
              <Link
                key={href}
                to={href}
                title={!showLabel ? label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors duration-150',
                  active
                    ? 'bg-accent-indigo/12 text-accent-indigo border border-accent-indigo/25'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface2',
                  !showLabel && 'justify-center px-2',
                )}
              >
                <Icon size={16} className="flex-shrink-0" />
                {showLabel && <span className="flex-1">{label}</span>}
                {badge != null && showLabel && (
                  <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-accent-crimson text-white text-[10px] font-bold px-1">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
                {badge != null && !showLabel && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent-crimson" />
                )}
              </Link>
            );
          })}

          <div className="border-t border-border-default my-1.5 mx-1" />

          <Link
            to="/"
            title={!showLabel ? 'View Site' : undefined}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-text-secondary hover:text-text-primary hover:bg-bg-surface2 transition-colors',
              !showLabel && 'justify-center px-2',
            )}
          >
            <Home size={16} className="flex-shrink-0" />
            {showLabel && 'View Site'}
          </Link>

          <button
            onClick={handleLogout}
            title={!showLabel ? 'Sign out' : undefined}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-text-muted hover:text-semantic-error hover:bg-semantic-error/08 transition-colors w-full',
              !showLabel && 'justify-center px-2',
            )}
          >
            <LogOut size={16} className="flex-shrink-0" />
            {showLabel && 'Sign out'}
          </button>
        </nav>

        {/* Email footer */}
        <div className={cn('pb-3 px-4 flex-shrink-0', !showLabel && 'px-2 flex justify-center')}>
          {showLabel && (
            <p className="text-[11px] text-text-muted truncate">{user?.email}</p>
          )}
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto bg-bg-surface min-w-0 pt-14 md:pt-0">
        {venueNames.length > 0 && (
          <div className="border-b border-border-default bg-gradient-to-r from-accent-indigo/8 to-accent-crimson/5 px-4 sm:px-6 py-2.5 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-accent-indigo tracking-wide uppercase">Partner Portal</span>
            <span className="text-text-muted text-xs">·</span>
            <span className="text-[11px] text-text-muted">Managing:</span>
            {venueNames.map((name) => (
              <span
                key={name}
                className="inline-flex items-center text-[11px] px-2.5 py-0.5 rounded-full bg-accent-crimson/10 text-accent-crimson font-semibold border border-accent-crimson/25"
              >
                {name}
              </span>
            ))}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
