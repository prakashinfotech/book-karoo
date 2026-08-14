import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Film, CalendarDays, MapPin, Clock,
  Ticket, Users, BarChart2, Image, Settings, LogOut, Menu, X, Home, Building2, Clapperboard,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/store/authStore';

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, href: ROUTES.ADMIN },
  { label: 'Movies', icon: Film, href: ROUTES.ADMIN_MOVIES },
  { label: 'Events', icon: CalendarDays, href: ROUTES.ADMIN_EVENTS },
  { label: 'Venues', icon: MapPin, href: ROUTES.ADMIN_VENUES },
  { label: 'Shows', icon: Clock, href: ROUTES.ADMIN_SHOWS },
  { label: 'Bookings', icon: Ticket, href: ROUTES.ADMIN_BOOKINGS },
  { label: 'Users', icon: Users, href: ROUTES.ADMIN_USERS },
  { label: 'Reports', icon: BarChart2, href: ROUTES.ADMIN_REPORTS },
  { label: 'CMS', icon: Image, href: ROUTES.ADMIN_CMS },
  { label: 'Settings', icon: Settings, href: ROUTES.ADMIN_SETTINGS },
  { label: 'Partners', icon: Building2, href: '/admin/partners' },
  { label: 'LYS Events', icon: Clapperboard, href: '/admin/lys/submissions' },
  { label: 'LYS Orgs', icon: Users, href: '/admin/lys/organizers' },
] as const;

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  function handleLogout() {
    clearAuth();
    navigate(ROUTES.HOME);
  }

  return (
    <div className="flex min-h-screen bg-bg-surface font-sans">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col flex-shrink-0 border-r border-border-default bg-bg-base transition-[width] duration-[220ms] relative z-[45]',
          collapsed ? 'w-[60px]' : 'w-[240px]'
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border-default">
          {!collapsed && (
            <span className="font-display font-bold text-base text-text-primary truncate">
              Book<span className="text-accent-crimson">Karoo</span>
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-text-muted hover:text-text-primary p-1 rounded flex-shrink-0"
          >
            {collapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="py-3 px-2 space-y-0.5">
          {NAV.map(({ label, icon: Icon, href }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                to={href}
                title={collapsed ? label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150',
                  active
                    ? 'bg-accent-crimson/12 text-accent-crimson border border-accent-crimson/25'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface2',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon size={16} className="flex-shrink-0" />
                {!collapsed && label}
              </Link>
            );
          })}
        </nav>

        {/* View Site + Sign out — directly below Settings, not at page bottom */}
        <div className={cn('border-t border-border-default mx-2 mt-1 pt-2 pb-3 space-y-0.5', collapsed && 'flex flex-col items-center mx-0 px-2')}>
          <Link
            to={ROUTES.HOME}
            title="View Site"
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text-secondary hover:text-text-primary hover:bg-bg-surface2 transition-colors w-full',
              collapsed && 'justify-center w-auto px-2'
            )}
          >
            <Home size={16} className="flex-shrink-0" />
            {!collapsed && <span className="font-sans">View Site</span>}
          </Link>

          <button
            onClick={handleLogout}
            title="Sign out"
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-text-muted hover:text-semantic-error hover:bg-semantic-error/08 transition-colors w-full',
              collapsed && 'justify-center w-auto px-2'
            )}
          >
            <LogOut size={16} className="flex-shrink-0" />
            {!collapsed && <span className="font-sans">Sign out</span>}
          </button>

          {!collapsed && (
            <p className="text-[11px] text-text-muted truncate px-3 pt-1">{user?.email}</p>
          )}
        </div>

        {/* Spacer so sidebar background fills remaining height */}
        <div className="flex-1" />
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-bg-surface">
        {children}
      </main>
    </div>
  );
}
