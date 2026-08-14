import { useCallback, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Bell, MapPin } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { PublicLayout } from '@/shared/components/layout/PublicLayout';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { useEventDetail, useRemindMeEvent, useEventAvailability, useCreateEventOrder } from '../api/useEvents';
import { useEventRealtime } from '../api/useEventRealtime';
import { usePassedViewport } from '@/shared/hooks/useScrollPosition';
import { TMDB_BACKDROP, TMDB_POSTER } from '@/shared/constants';
import { cn } from '@/shared/lib/utils';
import { toast } from '@/shared/components/ui/Toast';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCheckoutStore } from '@/shared/store/checkoutStore';
import { TierSelector } from '../components/TierSelector';
import type { EventDetail, PriceTier, TierAvailability } from '../types';
import type { ApiError } from '@/shared/types';

type Tab = 'about' | 'artists' | 'venue';

export default function EventDetailPage() {
  const { slug = '' } = useParams();
  const navigate       = useNavigate();
  const location       = useLocation();
  const { data: event, isLoading } = useEventDetail(slug);
  const heroCTARef    = useRef<HTMLDivElement>(null);
  const stickyVisible = usePassedViewport(heroCTARef);
  const [activeTab, setActiveTab] = useState<Tab>('about');

  // Auth + checkout
  const { isAuthenticated } = useAuthStore();
  const checkoutStore        = useCheckoutStore();

  // Tier selection state
  const [selectedTier, setSelectedTier] = useState<TierAvailability | null>(null);
  const [selectedQty,  setSelectedQty]  = useState(1);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  // Availability
  const { data: availabilityData, isLoading: availLoading } = useEventAvailability(event?.id ?? '');

  // Build displayTiers — use real availability data when present, otherwise derive
  // clickable tiers from event.allPriceTiers so booking is always accessible even
  // if the availability API hasn't responded yet or returns empty.
  const displayTiers: TierAvailability[] = (() => {
    if (availabilityData?.tiers && availabilityData.tiers.length > 0) {
      return availabilityData.tiers;
    }
    if (!event) return [];
    return event.allPriceTiers.map((t) => ({
      tierName:        t.name,
      capacity:        t.capacity ?? 999,
      booked:          0,
      locked:          0,
      available:       t.capacity ?? 999,
      availabilityPct: 100,
      color:           t.color,
    }));
  })();

  // Realtime capacity updates
  const qc = useQueryClient();
  const handleCapacityChange = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['event-availability', event?.id] });
  }, [qc, event?.id]);
  useEventRealtime(event?.id ?? '', handleCapacityChange);

  // Create event order
  const createEventOrder = useCreateEventOrder();

  // Price lookup per tier (used by TierSelector to show each tier's price)
  const tierPrices: Record<string, number> = Object.fromEntries(
    (event?.allPriceTiers ?? []).map((t) => [t.name.toLowerCase(), t.price])
  );

  // Unit price for the currently selected tier (for pricing preview)
  const unitPrice = selectedTier
    ? (tierPrices[selectedTier.tierName.toLowerCase()] ?? 0)
    : 0;

  async function handleProceedToCheckout() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (!selectedTier || !event) return;

    try {
      const result = await createEventOrder.mutateAsync({
        eventId:        event.id,
        tierName:       selectedTier.tierName,
        quantity:       selectedQty,
        idempotencyKey,
      });
      checkoutStore.setOrder(result);
      checkoutStore.setEventContext({
        eventId:    event.id,
        eventTitle: event.title,
        tierName:   selectedTier.tierName,
        quantity:   selectedQty,
        unitPrice,
        posterUrl:  event.posterUrl ?? null,
        eventDate:  event.eventDate ?? null,
        venueName:  event.venueName,
        cityName:   event.cityName,
      });
      navigate('/booking/event-checkout');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr?.statusCode === 409) {
        toast('Not enough tickets available. Please select fewer.', 'error');
        void qc.invalidateQueries({ queryKey: ['event-availability', event.id] });
      } else {
        toast(apiErr?.message ?? 'Failed to create order. Please try again.', 'error');
      }
    }
  }

  if (isLoading) return (
    <PublicLayout>
      <Skeleton className="h-[440px] w-full rounded-none" />
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Skeleton height={48} width="50%" />
        <Skeleton height={24} width="30%" />
      </div>
    </PublicLayout>
  );

  if (!event) return (
    <PublicLayout>
      <div className="flex items-center justify-center min-h-[60vh] text-text-muted font-sans">
        Event not found.
      </div>
    </PublicLayout>
  );

  const backdropUrl = event.backdropUrl ? TMDB_BACKDROP(event.backdropUrl) : null;
  const posterUrl   = event.posterUrl   ? TMDB_POSTER(event.posterUrl)     : null;
  const hasTickets  = event.priceTiers.length > 0;

  return (
    <PublicLayout>
      {/* ── HERO BACKDROP */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden">
        {backdropUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center scale-105"
            style={{ backgroundImage: `url(${backdropUrl})`, filter: 'blur(2px) brightness(0.28)' }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/55 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(65%_55%_at_60%_25%,rgba(99,102,241,0.22),transparent)]" />
      </div>

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-28">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 -mt-40 md:-mt-48 relative z-10">
          {/* Poster */}
          <div className="flex justify-center md:block">
            <div className="w-32 md:w-full aspect-[3/4] rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.65)] border border-white/10 bg-bg-surface2">
              {posterUrl
                ? <img src={posterUrl} alt={event.title} className="w-full h-full object-cover" />
                : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-text-muted">
                    <span className="text-4xl">🎪</span>
                    <span className="text-xs font-sans text-center px-2">{event.title}</span>
                  </div>
                )}
            </div>
          </div>

          {/* Metadata */}
          <section className="pt-0 md:pt-10">
            <p className="text-[11px] font-semibold text-text-muted tracking-widest uppercase font-sans mb-2">
              {event.type}
              {event.language ? ` · ${event.language}` : ''}
              {event.durationMin ? ` · ${event.durationMin} mins` : ''}
            </p>

            <h1 className="font-display font-bold text-3xl md:text-5xl tracking-tight leading-[1.08] mb-4">
              {event.title}
            </h1>

            <div className="flex flex-wrap gap-2 mb-5">
              <Badge color="indigo">{event.eventDateLabel}</Badge>
              <Badge color="indigo">{event.eventTimeLabel}</Badge>
              {event.ageRestriction > 0 && <Badge color="error">{event.ageRestriction}+</Badge>}
              {event.language && <Badge>{event.language}</Badge>}
            </div>

            <div className="flex items-center gap-1.5 text-sm text-text-secondary font-sans mb-6">
              <MapPin size={14} className="text-accent-crimson flex-shrink-0" />
              <span>{event.venueName}, {event.cityName}</span>
            </div>

            {/* CTAs */}
            <div ref={heroCTARef} className="flex gap-3 flex-wrap">
              {hasTickets ? (
                <Button
                  size="lg"
                  onClick={() => {
                    document.getElementById('tier-selector')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  🎟 Book Tickets
                </Button>
              ) : (
                <RemindMeButton eventId={event.id} />
              )}
            </div>
          </section>
        </div>

        {/* ── TIER SELECTOR / BOOKING SECTION */}
        {hasTickets && (
          <div id="tier-selector" className="mt-10 p-6 rounded-xl bg-bg-surface border border-border-default">
            <h2 className="font-display font-semibold text-xl mb-5">Select Tickets</h2>

            {availLoading && displayTiers.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} height={80} className="rounded-xl" />
                ))}
              </div>
            ) : (
              <>
                <TierSelector
                  tiers={displayTiers}
                  selectedTier={selectedTier}
                  selectedQty={selectedQty}
                  tierPrices={tierPrices}
                  onSelectTier={(tier) => {
                    setSelectedTier(tier);
                    setSelectedQty(1);
                  }}
                  onSelectQty={setSelectedQty}
                  unitPrice={unitPrice}
                />

                {selectedTier && selectedQty > 0 && (
                  <button
                    type="button"
                    disabled={createEventOrder.isPending}
                    onClick={() => void handleProceedToCheckout()}
                    className="w-full mt-5 py-3.5 rounded-full bg-gradient-to-r from-accent-crimson-light to-accent-crimson text-white font-semibold font-sans text-base hover:-translate-y-0.5 transition-all disabled:opacity-50 shadow-[0_10px_40px_-10px_rgba(225, 29, 116,0.5)]"
                  >
                    {createEventOrder.isPending ? 'Processing…' : `Proceed to Checkout — ₹${(unitPrice * selectedQty).toLocaleString('en-IN')} →`}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ── PRICE TIERS CARD (shown when no availability data but has priceTiers) */}
        {!hasTickets && event.allPriceTiers.length > 0 && (
          <div className="mt-10 p-6 rounded-xl bg-bg-surface border border-border-default">
            <h2 className="font-display font-semibold text-xl mb-4">Ticket Prices</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {event.allPriceTiers.map((tier) => (
                <TierCard key={tier.name} tier={tier} />
              ))}
            </div>
            <p className="text-sm text-text-muted font-sans mt-3">
              Booking opens soon — set a reminder to be notified.
            </p>
          </div>
        )}

        {/* ── TABS */}
        <div className="mt-10 border-b border-border-default">
          <div className="flex gap-1">
            {(['about', 'artists', 'venue'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={cn(
                  'px-5 py-3 text-sm font-semibold font-sans capitalize border-b-2 -mb-px transition-colors',
                  activeTab === t
                    ? 'border-accent-crimson text-text-primary'
                    : 'border-transparent text-text-muted hover:text-text-secondary',
                )}
              >
                {t === 'artists' ? 'Artists / Lineup' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 max-w-3xl">
          {activeTab === 'about'   && <AboutTab   event={event} />}
          {activeTab === 'artists' && <ArtistsTab event={event} />}
          {activeTab === 'venue'   && <VenueTab   event={event} />}
        </div>
      </main>

      {/* ── STICKY BAR */}
      {stickyVisible && hasTickets && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-4 px-6 py-3
          bg-bg-surface/95 backdrop-blur-xl border-t border-border-default shadow-lg mb-[56px] md:mb-0">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-text-primary text-sm truncate font-sans">{event.title}</p>
            <p className="text-xs text-text-muted font-sans">
              from ₹{event.lowestPrice.toLocaleString('en-IN')}
            </p>
          </div>
          <Button
            size="md"
            onClick={() => {
              document.getElementById('tier-selector')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Book Tickets →
          </Button>
        </div>
      )}
    </PublicLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TierCard({ tier }: { tier: PriceTier }) {
  return (
    <div className="p-4 rounded-lg bg-bg-surface2 border border-border-default text-center">
      <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ background: tier.color }} />
      <p className="text-sm font-semibold text-text-primary font-sans">{tier.name}</p>
      <p className="text-xl font-bold text-accent-indigo font-display mt-1">
        ₹{tier.price.toLocaleString('en-IN')}
      </p>
      <p className="text-[11px] text-text-muted font-sans mt-1">{tier.capacity} seats</p>
    </div>
  );
}

function AboutTab({ event }: { event: EventDetail }) {
  return (
    <div className="space-y-8">
      {event.description && (
        <div>
          <h3 className="font-display font-semibold text-xl mb-3">About the Event</h3>
          <p className="text-text-secondary leading-relaxed font-sans">{event.description}</p>
        </div>
      )}

      {event.organizer && (
        <div>
          <h3 className="font-display font-semibold text-xl mb-3">Organizer</h3>
          <div className="p-4 rounded-xl bg-bg-surface border border-border-default font-sans text-sm space-y-1">
            <p className="font-semibold text-text-primary">{event.organizer.name}</p>
            {event.organizer.stadium && (
              <p className="text-text-muted">Venue: {event.organizer.stadium}</p>
            )}
            {event.organizer.contact && (
              <p className="text-text-muted">Contact: {event.organizer.contact}</p>
            )}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-display font-semibold text-xl mb-4">Event Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-5 rounded-xl bg-bg-surface border border-border-default">
          {[
            { label: 'Date',     value: event.eventDateLabel },
            { label: 'Time',     value: event.eventTimeLabel },
            { label: 'Duration', value: event.durationMin ? `${event.durationMin} mins` : '—' },
            { label: 'Language', value: event.language ?? '—' },
            { label: 'Age',      value: event.ageRestriction > 0 ? `${event.ageRestriction}+` : 'All ages' },
            { label: 'Type',     value: event.type },
          ].map((f) => (
            <div key={f.label}>
              <p className="text-[10px] font-semibold text-text-muted tracking-wider uppercase font-sans">{f.label}</p>
              <p className="text-sm font-semibold text-text-primary mt-1 font-sans">{f.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ArtistsTab({ event }: { event: EventDetail }) {
  if (event.artists.length === 0) {
    return <p className="text-text-muted font-sans text-sm">Artist lineup not available yet.</p>;
  }
  return (
    <div>
      <h3 className="font-display font-semibold text-xl mb-5">Lineup</h3>
      <div className="flex flex-wrap gap-4">
        {event.artists.map((artist, i) => (
          <div key={i} className="flex flex-col items-center gap-2 w-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-indigo to-accent-purple flex items-center justify-center text-white font-bold text-xl">
              {artist.name.charAt(0)}
            </div>
            <p className="text-xs font-semibold text-text-primary font-sans line-clamp-1">{artist.name}</p>
            <p className="text-[11px] text-text-muted font-sans line-clamp-1">{artist.type}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VenueTab({ event }: { event: EventDetail }) {
  const hasCoords = event.venueLatitude !== null && event.venueLongitude !== null;
  const mapsHref  = hasCoords
    ? `https://maps.google.com/?q=${event.venueLatitude},${event.venueLongitude}`
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-semibold text-xl mb-3">Venue</h3>
        <div className="p-5 rounded-xl bg-bg-surface border border-border-default space-y-3 font-sans">
          <p className="font-semibold text-text-primary text-base">{event.venueName}</p>
          {event.venueAddress && (
            <div className="flex items-start gap-2 text-text-muted text-sm">
              <MapPin size={14} className="mt-0.5 flex-shrink-0 text-accent-crimson" />
              <span>{event.venueAddress}, {event.cityName}</span>
            </div>
          )}
          {event.venueAmenities.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {event.venueAmenities.map((a) => (
                <span key={a} className="px-2.5 py-1 rounded-full bg-bg-surface2 text-text-secondary text-xs font-sans border border-border-default">
                  {a}
                </span>
              ))}
            </div>
          )}
          {mapsHref && (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-accent-indigo hover:underline font-semibold"
            >
              <MapPin size={13} /> View on Google Maps →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function RemindMeButton({ eventId }: { eventId: string }) {
  const { mutate, isPending, isSuccess } = useRemindMeEvent(eventId);
  return (
    <Button
      size="lg"
      variant="secondary"
      loading={isPending}
      onClick={() => mutate()}
      disabled={isSuccess}
    >
      <Bell size={18} /> {isSuccess ? 'You\'ll be notified!' : 'Notify Me'}
    </Button>
  );
}
