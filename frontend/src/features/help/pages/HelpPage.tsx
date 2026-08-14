import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { PublicLayout } from '@/shared/components/layout/PublicLayout';
import { FAQ_ITEMS } from '@/shared/constants/faq';
import { FaqAccordion } from '../components/FaqAccordion';
import { ContactForm } from '../components/ContactForm';
import { useAuthStore } from '@/features/auth/store/authStore';
import { cn } from '@/shared/lib/utils';

// All category tab labels
const ALL_CATEGORIES = ['All', ...FAQ_ITEMS.map((f) => f.category)] as const;
type CategoryLabel = (typeof ALL_CATEGORIES)[number];

// Quick links
const QUICK_LINKS = [
  { icon: '📋', label: 'FAQ', href: '#faq-section' },
  { icon: '✉️', label: 'Contact Us', href: '#contact-section' },
  { icon: '🎟', label: 'My Bookings', href: '/profile/bookings' },
] as const;

export default function HelpPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryLabel>('All');

  // Derive filtered FAQ items
  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    const categoryItems =
      activeCategory === 'All'
        ? FAQ_ITEMS
        : FAQ_ITEMS.filter((f) => f.category === activeCategory);

    if (!q) return categoryItems;

    return categoryItems
      .map((cat) => ({
        ...cat,
        questions: cat.questions.filter(
          (item) =>
            item.q.toLowerCase().includes(q) ||
            item.a.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.questions.length > 0);
  }, [search, activeCategory]);

  const totalResults = filteredItems.reduce((acc, c) => acc + c.questions.length, 0);

  return (
    <PublicLayout>
      <Helmet><title>Help &amp; Support | BookKaroo</title></Helmet>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-bg-surface to-bg-surface2 py-14 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-4" aria-hidden="true">🎧</div>
          <h1 className="font-display font-bold text-3xl text-text-primary mb-3">
            How can we help?
          </h1>
          <p className="text-sm font-sans text-text-muted mb-8">
            Search our help articles or browse by category below.
          </p>

          {/* Search */}
          <div className="relative max-w-lg mx-auto">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActiveCategory('All');
              }}
              placeholder="Search for help…"
              aria-label="Search frequently asked questions"
              className="w-full pl-11 pr-5 py-3 rounded-xl bg-bg-surface border border-border-default text-text-primary placeholder-text-muted text-sm font-sans focus:outline-none focus:border-accent-crimson transition-colors"
            />
          </div>
        </div>
      </section>

      {/* ── Quick links ───────────────────────────────────────────────────────── */}
      <section className="max-w-[1280px] mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {QUICK_LINKS.map(({ icon, label, href }) => {
            const cardClass =
              'flex flex-col items-center gap-2 p-5 rounded-xl bg-bg-surface border border-border-default hover:border-border-strong hover:bg-bg-surface2 transition-all text-center';

            if (href.startsWith('#')) {
              return (
                <a key={label} href={href} className={cardClass}>
                  <span className="text-2xl" aria-hidden="true">{icon}</span>
                  <span className="text-sm font-semibold font-sans text-text-secondary">{label}</span>
                </a>
              );
            }
            return (
              <Link key={label} to={href} className={cardClass}>
                <span className="text-2xl" aria-hidden="true">{icon}</span>
                <span className="text-sm font-semibold font-sans text-text-secondary">{label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── FAQ section ───────────────────────────────────────────────────────── */}
      <section id="faq-section" className="max-w-[1280px] mx-auto px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display font-bold text-2xl text-text-primary mb-2">
            Frequently Asked Questions
          </h2>

          {search && (
            <p className="text-sm font-sans text-text-muted mb-4">
              {totalResults === 0
                ? 'No results found for your search.'
                : `${totalResults} result${totalResults !== 1 ? 's' : ''} for "${search}"`}
            </p>
          )}

          {/* Category tabs — hidden while searching */}
          {!search && (
            <div className="flex gap-2 flex-wrap mb-6 mt-4">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-xs font-semibold font-sans border transition-colors',
                    activeCategory === cat
                      ? 'bg-accent-crimson border-accent-crimson text-white'
                      : 'bg-bg-surface border-border-default text-text-secondary hover:border-border-strong'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* FAQ list */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3" aria-hidden="true">🔍</div>
              <p className="text-text-muted font-sans text-sm">
                No results found. Try a different search term or{' '}
                <a href="#contact-section" className="text-accent-crimson hover:underline">
                  contact support
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredItems.map((cat) => (
                <div key={cat.category}>
                  {(activeCategory === 'All' || search) && (
                    <h3 className="font-display font-semibold text-base text-text-primary mb-3">
                      {cat.category}
                    </h3>
                  )}
                  <FaqAccordion questions={cat.questions} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Contact section ───────────────────────────────────────────────────── */}
      <section
        id="contact-section"
        className="bg-bg-surface2 border-t border-border-default py-16 px-6"
      >
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-display font-bold text-2xl text-text-primary mb-2">
              Still need help?
            </h2>
            <p className="text-sm font-sans text-text-muted">
              Our support team typically responds within 24 hours.
            </p>
          </div>

          <ContactForm defaultEmail={user?.email ?? ''} />
        </div>
      </section>
    </PublicLayout>
  );
}
