import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Phone, Mail, ChevronRight, Pencil, X } from 'lucide-react';
import { PartnerLayout } from '../components/PartnerLayout';
import { usePartnerVenues, usePartnerVenueDetail, useUpdatePartnerVenue } from '../api/usePartner';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Modal } from '@/shared/components/ui/Modal';

// ── Amenity chips input ───────────────────────────────────────────────────────

function AmenityChipsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');

  function addChip() {
    const t = input.trim().replace(/,$/, '');
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput('');
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addChip(); }
    if (e.key === 'Backspace' && !input && value.length > 0) onChange(value.slice(0, -1));
  }

  return (
    <div
      className="w-full min-h-[42px] px-2 py-1.5 rounded-lg bg-bg-surface2 border border-border-default focus-within:border-accent-indigo flex flex-wrap gap-1.5 items-center"
      onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}
    >
      {value.map((chip) => (
        <span key={chip} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-accent-indigo/15 text-accent-indigo font-medium">
          {chip}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(value.filter((c) => c !== chip)); }}
            className="hover:text-text-primary leading-none"
            aria-label={`Remove ${chip}`}
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={addChip}
        placeholder={value.length === 0 ? 'Type amenity + Enter to add…' : ''}
        className="flex-1 min-w-[120px] bg-transparent text-sm text-text-primary focus:outline-none placeholder:text-text-muted py-0.5"
      />
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────

function EditVenueModal({ venueId, onClose }: { venueId: string; onClose: () => void }) {
  const { data: venue, isLoading: loadingVenue } = usePartnerVenueDetail(venueId);
  const update = useUpdatePartnerVenue(venueId);

  const [phone,     setPhone]     = useState('');
  const [email,     setEmail]     = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [emailErr,  setEmailErr]  = useState('');

  useEffect(() => {
    if (!venue) return;
    setPhone(venue.contactPhone ?? '');
    setEmail(venue.contactEmail ?? '');
    let items: string[] = [];
    try { items = JSON.parse(venue.amenities ?? '[]') as string[]; }
    catch { items = (venue.amenities ?? '').split(',').map((s) => s.trim()).filter(Boolean); }
    setAmenities(items);
  }, [venue]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailErr('Invalid email'); return;
    }
    setEmailErr('');
    update.mutate(
      {
        contactPhone: phone || undefined,
        contactEmail: email || undefined,
        amenities:    amenities.length > 0 ? JSON.stringify(amenities) : undefined,
      },
      { onSuccess: onClose }
    );
  }

  const lockedField = 'w-full px-3 py-2 rounded-lg bg-bg-surface3 border border-border-default/60 text-text-muted text-sm select-none cursor-not-allowed';

  return (
    <Modal open onClose={onClose} maxWidth="max-w-md">
      <h2 className="font-display font-bold text-xl text-text-primary mb-5">Edit Venue Details</h2>

      {loadingVenue ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height={40} />)}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Locked fields ── */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
              <span className="text-text-muted">🔒</span> Venue Name
            </label>
            <div className={lockedField}>{venue?.name ?? '—'}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
                <span>🔒</span> Chain
              </label>
              <div className={lockedField}>{venue?.chain || '—'}</div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">
                <span>🔒</span> City
              </label>
              <div className={lockedField}>{venue?.cityName ?? '—'}</div>
            </div>
          </div>

          {/* ── Editable fields ── */}
          <div className="border-t border-border-default pt-4 space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
                <span>✏️</span> Contact Phone
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo"
                placeholder="+91 99999 99999"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
                <span>✏️</span> Contact Email
              </label>
              <input
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailErr(''); }}
                className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo"
                placeholder="venue@example.com"
              />
              {emailErr && <p className="text-xs text-semantic-error mt-1">{emailErr}</p>}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
                <span>✏️</span> Amenities
              </label>
              <AmenityChipsInput value={amenities} onChange={setAmenities} />
              <p className="text-[11px] text-text-muted mt-1">Type an amenity and press Enter or comma to add it</p>
            </div>
          </div>

          {update.isError && (
            <p className="text-xs text-semantic-error">Failed to update. Please try again.</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-border-default text-text-secondary text-sm hover:bg-bg-surface2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={update.isPending}
              className="flex-1 py-2 rounded-lg bg-accent-indigo text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {update.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PartnerVenuesPage() {
  const { data: venues, isLoading, isError, refetch } = usePartnerVenues();
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);

  return (
    <PartnerLayout>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-display font-bold text-text-primary">My Venues</h1>
          <p className="text-sm text-text-secondary mt-1">Venues assigned to your partner account.</p>
        </header>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} height={160} />)}
          </div>
        )}

        {isError && (
          <div className="rounded-md border border-semantic-error/30 bg-semantic-error/08 p-4 text-sm text-semantic-error flex items-center justify-between">
            <span>Failed to load venues.</span>
            <button onClick={() => refetch()} className="underline hover:opacity-80">Retry</button>
          </div>
        )}

        {venues && venues.length === 0 && (
          <div className="rounded-lg border border-border-default bg-bg-base p-8 text-center">
            <Building2 size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-text-muted text-sm">No venues assigned to your account yet.</p>
            <p className="text-text-muted text-xs mt-1">Contact your admin to grant venue access.</p>
          </div>
        )}

        {venues && venues.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {venues.map((venue) => (
              <div key={venue.id} className="rounded-xl border border-border-default bg-bg-base p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary truncate">{venue.name}</h3>
                    <p className="text-xs text-text-muted mt-0.5 truncate">{venue.address}</p>
                    <p className="text-xs text-text-secondary">{venue.cityName}</p>
                  </div>
                  <span className={`flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${venue.isActive ? 'bg-semantic-success/15 text-semantic-success' : 'bg-bg-surface3 text-text-muted'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${venue.isActive ? 'bg-semantic-success' : 'bg-text-muted'}`} />
                    {venue.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="text-xs text-text-secondary space-y-1">
                  <p className="font-medium text-text-muted">{venue.screenCount} screen{venue.screenCount !== 1 ? 's' : ''}</p>
                  {venue.contactPhone && (
                    <p className="flex items-center gap-1.5"><Phone size={11} className="flex-shrink-0" /> {venue.contactPhone}</p>
                  )}
                  {venue.contactEmail && (
                    <p className="flex items-center gap-1.5"><Mail size={11} className="flex-shrink-0" /> {venue.contactEmail}</p>
                  )}
                </div>

                <div className="flex gap-2 mt-auto pt-1">
                  <button
                    onClick={() => setEditingVenueId(venue.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-default text-text-secondary text-xs hover:text-accent-indigo hover:border-accent-indigo transition-colors"
                  >
                    <Pencil size={12} /> Edit Contact
                  </button>
                  <Link
                    to={`/partner/venues/${venue.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-indigo/12 text-accent-indigo text-xs hover:bg-accent-indigo/20 transition-colors"
                  >
                    View Screens <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingVenueId && (
        <EditVenueModal
          venueId={editingVenueId}
          onClose={() => setEditingVenueId(null)}
        />
      )}
    </PartnerLayout>
  );
}
