import { Link, useLocation } from 'react-router-dom';
import { Home, Film, Ticket, User, Search } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { ROUTES } from '@/shared/constants';

const NAV_ITEMS = [
  { label: 'Home', icon: Home, href: ROUTES.HOME },
  { label: 'Movies', icon: Film, href: ROUTES.MOVIES },
  { label: 'Search', icon: Search, href: ROUTES.SEARCH },
  { label: 'Tickets', icon: Ticket, href: ROUTES.MY_BOOKINGS },
  { label: 'Profile', icon: User, href: ROUTES.PROFILE },
] as const;

export function MobileNav() {
  const { pathname } = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border-default bg-bg-surface/90 backdrop-blur-md pb-[env(safe-area-inset-bottom,0)]">
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
          const active = pathname === href;
          return (
            <li key={label}>
              <Link
                to={href}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 text-[10px] font-medium font-sans transition-colors',
                  active ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'
                )}
              >
                <Icon size={22} className={active ? 'text-accent-crimson' : undefined} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
