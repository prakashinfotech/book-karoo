import { Helmet } from 'react-helmet-async';
import { PublicLayout } from '@/shared/components/layout/PublicLayout';
import { HeroCarousel } from '../components/HeroCarousel';
import { MovieRail } from '../components/MovieRail';
import { IplStrip } from '../components/IplStrip';
import { EventRail } from '../components/EventRail';
import { useHomeData } from '../api/useHome';
import { useCityStore } from '@/shared/store/cityStore';
import { ROUTES } from '@/shared/constants';
import type { BannerItem } from '@/features/events/types';

function BannerStrip({ banners }: { banners: BannerItem[] }) {
  if (!banners.length) return null;
  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-6 pt-6">
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {banners.map((b) => {
          const inner = (
            <div
              key={b.id}
              className="flex-shrink-0 relative rounded-xl overflow-hidden bg-bg-surface2 border border-border-default"
              style={{ width: 280, height: 120 }}
            >
              {b.imageUrl
                ? <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                : <div className="flex items-center justify-center h-full text-text-muted text-sm font-sans">{b.title}</div>
              }
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-2 left-3 text-white text-xs font-semibold font-sans drop-shadow">{b.title}</span>
            </div>
          );
          return b.linkUrl
            ? <a key={b.id} href={b.linkUrl}>{inner}</a>
            : <div key={b.id}>{inner}</div>;
        })}
      </div>
    </div>
  );
}

const STATS = [
  { num: '4,200+', label: 'screens nationwide' },
  { num: '98%',   label: 'on-time entry' },
  { num: '2.1M',  label: 'tickets monthly' },
  { num: '4.8★',  label: 'average app rating' },
];

export default function HomePage() {
  const { selectedCity } = useCityStore();
  const cityId = selectedCity?.id ?? null;

  const { data, isLoading } = useHomeData(cityId);

  const heroMovies = data?.nowShowing?.slice(0, 3) ?? [];

  return (
    <PublicLayout>
      <Helmet><title>BookKaroo — Book the moment. Karo it now.</title></Helmet>
      {/* Hero */}
      <HeroCarousel movies={heroMovies} isLoading={isLoading} />

      {/* CMS Banners — rendered only when active banners exist */}
      {data?.banners && data.banners.length > 0 && (
        <BannerStrip banners={data.banners} />
      )}

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 pt-12">
        {/* Now Showing */}
        <MovieRail
          title="Now Showing"
          eyebrow="In cinemas now"
          movies={data?.nowShowing}
          isLoading={isLoading}
          seeAllHref={ROUTES.MOVIES}
          seeAllLabel={`View all ${data?.nowShowing?.length ?? 0}+ →`}
        />

        {/* IPL Strip */}
        <IplStrip matches={data?.iplMatches} />

        {/* Coming Soon */}
        <MovieRail
          title="Mark Your Calendar"
          eyebrow="Coming soon"
          movies={data?.comingSoon}
          isLoading={isLoading}
          coming
          seeAllHref={`${ROUTES.MOVIES}?category=ComingSoon`}
          seeAllLabel="Set reminders →"
        />

        {/* Live Events */}
        <EventRail
          title="Live Events & Concerts"
          eyebrow="Happening near you"
          events={data?.liveEvents}
          isLoading={isLoading}
          seeAllHref={ROUTES.EVENTS}
          seeAllLabel="All events →"
        />

        {/* Plays */}
        <EventRail
          title="Plays & Theatre"
          eyebrow="Stage performances"
          events={data?.plays}
          isLoading={isLoading}
          seeAllHref={ROUTES.PLAYS}
          seeAllLabel="All plays →"
        />

        {/* Stand-Up Comedy */}
        <EventRail
          title="Stand-Up Comedy"
          eyebrow="Laugh out loud"
          events={data?.comedy}
          isLoading={isLoading}
          seeAllHref={ROUTES.EVENTS + '?type=comedy'}
          seeAllLabel="All shows →"
        />

        {/* Trust band */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-t border-b border-border-default mb-0">
          {STATS.map(({ num, label }) => (
            <div key={label} className="text-center">
              <div className="font-display font-semibold text-3xl text-text-primary">{num}</div>
              <div className="text-xs text-text-muted uppercase tracking-wider mt-1 font-sans">{label}</div>
            </div>
          ))}
        </section>
      </div>
    </PublicLayout>
  );
}
