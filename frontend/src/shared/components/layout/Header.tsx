import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { MapPin, User, LogOut, ChevronDown, LayoutDashboard, Building2, Menu, X, Clapperboard } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { ROUTES } from '@/shared/constants';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCityStore } from '@/shared/store/cityStore';
import { useCities } from '@/features/cities/api/useCities';
import { CityModal } from '@/shared/components/CityModal';
import { SearchBar } from '@/shared/components/SearchBar';
import { Button } from '@/shared/components/ui/Button';
import { api } from '@/shared/lib/api';

const CATEGORY_LINKS = [
  { label: 'Movies',     href: ROUTES.MOVIES },
  { label: 'Events',     href: ROUTES.EVENTS },
  { label: 'Plays',      href: ROUTES.PLAYS },
  { label: 'Sports',     href: ROUTES.SPORTS },
  { label: 'Activities', href: ROUTES.ACTIVITIES },
  { label: 'IPL 2026',   href: ROUTES.IPL },
] as const;

export function Header() {
  const [scrolled, setScrolled]             = useState(false);
  const [cityModalOpen, setCityModalOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen]     = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const { selectedCity } = useCityStore();
  const { data: cities } = useCities();
  const navigate = useNavigate();

  useEffect(() => {
    if (cities && cities.length > 0 && !selectedCity) {
      setCityModalOpen(true);
    }
  }, [cities, selectedCity]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  function closeMobileMenu() { setMobileMenuOpen(false); }

  async function handleLogout() {
    try { await api.post('/api/auth/logout'); } catch { /* ignore */ }
    clearAuth();
    setUserMenuOpen(false);
    closeMobileMenu();
    navigate(ROUTES.HOME);
  }

  return (
    <>
      {/* ── Row 1: Main header ─────────────────────────────────────────── */}
      <header
        className={cn(
          'sticky top-0 z-40 h-16 bg-bg-surface border-b border-border-default transition-shadow duration-[220ms]',
          scrolled ? 'shadow-md' : 'shadow-sm'
        )}
      >
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 h-full flex items-center gap-3 md:gap-4">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex-shrink-0" onClick={closeMobileMenu}>
            <span className="font-display font-bold text-xl tracking-tight text-text-primary">
              Book<span className="text-accent-crimson">Karoo</span>
            </span>
          </Link>

          {/* City selector — desktop only */}
          <button
            onClick={() => setCityModalOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-default text-text-secondary text-sm font-sans hover:border-accent-crimson hover:text-accent-crimson transition-colors duration-150 flex-shrink-0 bg-bg-surface2"
          >
            <MapPin size={13} className="text-accent-crimson flex-shrink-0" />
            <span className="max-w-[100px] truncate">{selectedCity?.name ?? 'Select City'}</span>
            <ChevronDown size={13} className="flex-shrink-0" />
          </button>

          {/* Search bar — desktop only */}
          <SearchBar className="hidden md:flex flex-1" />

          {/* Mobile spacer */}
          <div className="flex-1 md:hidden" />

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Auth — desktop */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-accent-crimson flex items-center justify-center text-white text-sm font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:inline text-sm font-medium text-text-secondary">{user.name.split(' ')[0]}</span>
                    <ChevronDown size={14} />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-52 bg-bg-surface border border-border-default rounded-xl shadow-lg z-50 py-1 font-sans">
                        <div className="px-4 py-3 border-b border-border-default">
                          <p className="text-sm font-semibold text-text-primary truncate">{user.name}</p>
                          <p className="text-xs text-text-muted truncate">{user.email}</p>
                        </div>
                        <Link to={ROUTES.MY_BOOKINGS} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-surface2 transition-colors">
                          <User size={15} /> My Bookings
                        </Link>
                        <Link to={ROUTES.PROFILE} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-surface2 transition-colors">
                          <User size={15} /> My Profile
                        </Link>
                        {user.role === 'Admin' && (
                          <Link to={ROUTES.ADMIN} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-surface2 transition-colors">
                            <LayoutDashboard size={15} /> Admin Panel
                          </Link>
                        )}
                        {(user.role === 'Partner' || user.isPartner) && (
                          <Link to="/partner" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-accent-indigo hover:bg-accent-indigo/10 transition-colors">
                            <Building2 size={15} /> Partner Portal
                          </Link>
                        )}
                        <Link to="/list-your-show/my-events" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-accent-indigo hover:bg-accent-indigo/10 transition-colors">
                          <Clapperboard size={15} /> List Your Show
                        </Link>
                        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 text-sm text-semantic-error hover:bg-semantic-error/10 transition-colors w-full">
                          <LogOut size={15} /> Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.LOGIN)}>Sign In</Button>
              )}
            </div>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -mr-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface2 transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Row 2: Category nav strip — desktop only ─────────────────────── */}
      <nav className="hidden md:block sticky top-16 z-39 bg-bg-surface2 border-b border-border-default shadow-sm">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6">
          <ul className="flex items-center overflow-x-auto scroll-hide">
            {CATEGORY_LINKS.map(({ label, href }) => (
              <li key={label}>
                <NavLink
                  to={href}
                  className={({ isActive }) =>
                    cn(
                      'block px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-150',
                      isActive
                        ? 'text-accent-crimson border-accent-crimson'
                        : 'text-text-secondary border-transparent hover:text-accent-crimson hover:border-accent-crimson/50'
                    )
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* ── Mobile menu overlay ──────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-[45] bg-bg-surface overflow-y-auto border-t border-border-default shadow-xl">
          <div className="px-4 py-5 space-y-4">

            {/* Search */}
            <SearchBar />

            {/* City selector */}
            <button
              onClick={() => { setCityModalOpen(true); closeMobileMenu(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border-default text-text-secondary hover:border-accent-crimson hover:text-accent-crimson transition-colors bg-bg-surface2"
            >
              <MapPin size={16} className="text-accent-crimson flex-shrink-0" />
              <span className="text-sm font-medium flex-1 text-left">{selectedCity?.name ?? 'Select City'}</span>
              <ChevronDown size={14} />
            </button>

            {/* Category links */}
            <div className="border-t border-border-default pt-4">
              <p className="text-[10px] font-semibold text-text-muted tracking-widest uppercase font-sans mb-2 px-1">Browse</p>
              <div className="space-y-0.5">
                {CATEGORY_LINKS.map(({ label, href }) => (
                  <NavLink
                    key={label}
                    to={href}
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-accent-crimson/10 text-accent-crimson font-semibold'
                          : 'text-text-secondary hover:bg-bg-surface2 hover:text-text-primary'
                      )
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Auth section */}
            <div className="border-t border-border-default pt-4">
              {isAuthenticated && user ? (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-3 px-3 py-3 mb-1">
                    <div className="w-9 h-9 rounded-full bg-accent-crimson flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{user.name}</p>
                      <p className="text-xs text-text-muted truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link to={ROUTES.MY_BOOKINGS} onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-text-secondary hover:bg-bg-surface2 hover:text-text-primary transition-colors">
                    <User size={16} /> My Bookings
                  </Link>
                  <Link to={ROUTES.PROFILE} onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-text-secondary hover:bg-bg-surface2 hover:text-text-primary transition-colors">
                    <User size={16} /> My Profile
                  </Link>
                  {user.role === 'Admin' && (
                    <Link to={ROUTES.ADMIN} onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-text-secondary hover:bg-bg-surface2 hover:text-text-primary transition-colors">
                      <LayoutDashboard size={16} /> Admin Panel
                    </Link>
                  )}
                  {(user.role === 'Partner' || user.isPartner) && (
                    <Link to="/partner" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-accent-indigo hover:bg-accent-indigo/10 transition-colors">
                      <Building2 size={16} /> Partner Portal
                    </Link>
                  )}
                  <Link to="/list-your-show/my-events" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-accent-indigo hover:bg-accent-indigo/10 transition-colors">
                    <Clapperboard size={16} /> List Your Show
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-semantic-error hover:bg-semantic-error/10 transition-colors w-full">
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => { navigate(ROUTES.LOGIN); closeMobileMenu(); }}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <CityModal open={cityModalOpen} onClose={() => setCityModalOpen(false)} />
    </>
  );
}
