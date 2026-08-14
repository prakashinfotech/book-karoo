import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getPosterUrl } from '@/shared/lib/imageUtils';
import {
  useMyLysEvent, useCreateLysEvent, useUpdateLysEvent,
  useSubmitLysEvent, useUploadLysImage, useLysCommissionRate, useLysVenues,
} from '../api/useLys';
import { LYS_EVENT_TYPES } from '../types';
import type { LysPriceTier, LysArtist } from '../types';
import { LysLayout } from '../components/LysLayout';

// ── Schemas ──────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  title:          z.string().min(2, 'Title is required'),
  type:           z.string().min(1, 'Event type is required'),
  description:    z.string().min(50, 'Description must be at least 50 characters'),
  language:       z.string().min(1, 'Language is required'),
  ageRestriction: z.coerce.number().default(0),
});

const step2Schema = z.object({
  eventDate:            z.string().min(1, 'Event date is required'),
  eventTime:            z.string().min(1, 'Event time is required'),
  durationMin:          z.coerce.number().optional(),
  venueType:            z.enum(['existing', 'custom']),
  venueId:              z.string().optional(),
  customVenueName:      z.string().optional(),
  customVenueAddress:   z.string().optional(),
  customVenueCity:      z.string().optional(),
  customVenueLatitude:  z.coerce.number().optional(),
  customVenueLongitude: z.coerce.number().optional(),
});

const LANGUAGES = ['Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi'];

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center gap-2 flex-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            s < step ? 'bg-accent-indigo text-white' :
            s === step ? 'bg-accent-indigo text-white ring-2 ring-accent-indigo/30' :
            'bg-bg-surface2 text-text-muted'
          }`}>
            {s < step ? '✓' : s}
          </div>
          {s < 4 && <div className={`flex-1 h-0.5 ${s < step ? 'bg-accent-indigo' : 'bg-bg-surface2'}`} />}
        </div>
      ))}
    </div>
  );
}

function TierEditor({ tiers, onChange }: {
  tiers: LysPriceTier[];
  onChange: (tiers: LysPriceTier[]) => void;
}) {
  function add() {
    onChange([...tiers, { name: 'General', price: 0, capacity: 100, color: '#4F46E5' }]);
  }
  function remove(i: number) {
    if (tiers.length <= 1) return;
    onChange(tiers.filter((_, idx) => idx !== i));
  }
  function update(i: number, field: keyof LysPriceTier, value: string | number) {
    const next = [...tiers];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text-primary text-sm">Ticket Tiers</h3>
        {tiers.length < 6 && (
          <button type="button" onClick={add}
            className="text-xs text-accent-indigo hover:underline">
            + Add Tier
          </button>
        )}
      </div>
      <div className="space-y-3">
        {tiers.map((tier, i) => (
          <div key={i} className="flex gap-3 items-start bg-bg-surface2 rounded-lg p-3 border border-border-default">
            <input type="color" value={tier.color} onChange={(e) => update(i, 'color', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer flex-shrink-0 mt-0.5" />
            <div className="flex-1 grid grid-cols-3 gap-2">
              <input value={tier.name} onChange={(e) => update(i, 'name', e.target.value)}
                placeholder="Tier name" className="px-2 py-1.5 bg-bg-base border border-border-default rounded text-xs text-text-primary" />
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted text-xs">₹</span>
                <input type="number" value={tier.price} min={0} onChange={(e) => update(i, 'price', Number(e.target.value))}
                  className="pl-5 pr-2 py-1.5 w-full bg-bg-base border border-border-default rounded text-xs text-text-primary" />
              </div>
              <input type="number" value={tier.capacity} min={1} onChange={(e) => update(i, 'capacity', Number(e.target.value))}
                placeholder="Capacity"
                className="px-2 py-1.5 bg-bg-base border border-border-default rounded text-xs text-text-primary" />
            </div>
            <button type="button" onClick={() => remove(i)} disabled={tiers.length <= 1}
              className="text-text-muted hover:text-semantic-error transition-colors disabled:opacity-30 flex-shrink-0 mt-1">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const ARTIST_TYPES = ['Singer', 'Comedian', 'Actor', 'Performer', 'DJ', 'Musician', 'Dancer', 'Speaker', 'Other'];

function ArtistEditor({ artists, onChange }: {
  artists: LysArtist[];
  onChange: (artists: LysArtist[]) => void;
}) {
  function add() {
    onChange([...artists, { name: '', type: 'Performer', bio: '' }]);
  }
  function remove(i: number) {
    onChange(artists.filter((_, idx) => idx !== i));
  }
  function update(i: number, field: keyof LysArtist, value: string) {
    const next = [...artists];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text-primary text-sm">Artists / Performers <span className="text-text-muted font-normal">(optional)</span></h3>
        {artists.length < 10 && (
          <button type="button" onClick={add} className="text-xs text-accent-indigo hover:underline">
            + Add Artist
          </button>
        )}
      </div>
      {artists.length === 0 ? (
        <button
          type="button"
          onClick={add}
          className="w-full border border-dashed border-border-default rounded-lg py-4 text-sm text-text-muted hover:border-accent-indigo hover:text-accent-indigo transition-colors"
        >
          + Add artist or performer
        </button>
      ) : (
        <div className="space-y-3">
          {artists.map((artist, i) => (
            <div key={i} className="bg-bg-surface2 border border-border-default rounded-lg p-3 space-y-2">
              <div className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    value={artist.name}
                    onChange={(e) => update(i, 'name', e.target.value)}
                    placeholder="Artist name"
                    className="px-3 py-1.5 bg-bg-base border border-border-default rounded text-xs text-text-primary focus:outline-none focus:border-accent-indigo"
                  />
                  <select
                    value={artist.type}
                    onChange={(e) => update(i, 'type', e.target.value)}
                    className="px-3 py-1.5 bg-bg-base border border-border-default rounded text-xs text-text-primary focus:outline-none focus:border-accent-indigo"
                  >
                    {ARTIST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-text-muted hover:text-semantic-error transition-colors flex-shrink-0 mt-1 text-xs"
                >
                  ✕
                </button>
              </div>
              <input
                value={artist.bio ?? ''}
                onChange={(e) => update(i, 'bio', e.target.value)}
                placeholder="Short bio or description (optional)"
                className="w-full px-3 py-1.5 bg-bg-base border border-border-default rounded text-xs text-text-primary focus:outline-none focus:border-accent-indigo"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LysCreateEventPage() {
  const { id: editId } = useParams<{ id?: string }>();
  const navigate        = useNavigate();
  const { data: existing } = useMyLysEvent(editId ?? null);
  const { data: commData } = useLysCommissionRate();
  const createEvent = useCreateLysEvent();
  const updateEvent = useUpdateLysEvent();
  const submitEvent = useSubmitLysEvent();
  const uploadImage = useUploadLysImage();

  const [step, setStep]         = useState(1);
  const [eventId, setEventId]   = useState<string | null>(editId ?? null);
  const [tiers, setTiers]       = useState<LysPriceTier[]>([{ name: 'General', price: 0, capacity: 100, color: '#4F46E5' }]);
  const [artists, setArtists]   = useState<LysArtist[]>([]);
  const [posterUrl, setPosterUrl]     = useState<string | null>(existing?.posterUrl ?? null);
  const [backdropUrl, setBackdropUrl] = useState<string | null>(existing?.backdropUrl ?? null);
  const [submitted, setSubmitted] = useState(false);
  const posterInputRef   = useRef<HTMLInputElement>(null);
  const backdropInputRef = useRef<HTMLInputElement>(null);

  const { data: venueOptions } = useLysVenues();
  const rate = commData?.rate ?? 5;

  const step1Form = useForm({ resolver: zodResolver(step1Schema), defaultValues: {
    title: existing?.title ?? '', type: existing?.type ?? '',
    description: existing?.description ?? '', language: existing?.language ?? 'Hindi',
    ageRestriction: existing?.ageRestriction ?? 0,
  }});

  const step2Form = useForm({ resolver: zodResolver(step2Schema), defaultValues: {
    eventDate: existing?.eventDate ? new Date(existing.eventDate).toLocaleDateString('en-CA') : '',
    eventTime: existing?.eventDate ? `${String(new Date(existing.eventDate).getHours()).padStart(2,'0')}:${String(new Date(existing.eventDate).getMinutes()).padStart(2,'0')}` : '',
    durationMin: existing?.durationMin ?? undefined,
    venueType: (existing?.venueType as 'existing' | 'custom') ?? 'custom',
    venueId: existing?.venueId ?? undefined,
    customVenueName: existing?.customVenueName ?? '',
    customVenueAddress: existing?.customVenueAddress ?? '',
    customVenueCity: existing?.customVenueCity ?? '',
    customVenueLatitude: existing?.customVenueLatitude ?? undefined,
    customVenueLongitude: existing?.customVenueLongitude ?? undefined,
  }});

  useEffect(() => {
    if (!existing) return;
    step1Form.reset({
      title: existing.title,
      type: existing.type,
      description: existing.description,
      language: existing.language,
      ageRestriction: existing.ageRestriction,
    });
    const d = existing.eventDate ? new Date(existing.eventDate) : null;
    const dateStr = d
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      : '';
    const timeStr = d
      ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      : '';
    step2Form.reset({
      eventDate: dateStr,
      eventTime: timeStr,
      durationMin: existing.durationMin ?? undefined,
      venueType: existing.venueType ?? 'custom',
      venueId: existing.venueId ?? undefined,
      customVenueName: existing.customVenueName ?? '',
      customVenueAddress: existing.customVenueAddress ?? '',
      customVenueCity: existing.customVenueCity ?? '',
      customVenueLatitude: existing.customVenueLatitude ?? undefined,
      customVenueLongitude: existing.customVenueLongitude ?? undefined,
    });
    if (existing.priceTiers?.length) setTiers(existing.priceTiers);
    if (existing.artists?.length) setArtists(existing.artists);
    if (existing.posterUrl) setPosterUrl(existing.posterUrl);
    if (existing.backdropUrl) setBackdropUrl(existing.backdropUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  async function handleStep1(data: z.infer<typeof step1Schema>) {
    const basePayload = {
      title: data.title, type: data.type, description: data.description,
      language: data.language, ageRestriction: data.ageRestriction,
      priceTiersJson: '[]',
    };

    if (eventId) {
      // Do NOT include eventDate here — editing step 1 must never overwrite the date set in step 2
      await updateEvent.mutateAsync({ id: eventId, data: basePayload as never });
    } else {
      const created = await createEvent.mutateAsync({ ...basePayload, eventDate: new Date().toISOString() } as never);
      setEventId((created as { id: string }).id);
    }
    setStep(2);
  }

  async function handleStep2(data: z.infer<typeof step2Schema>) {
    if (!eventId) return;
    const eventDate = new Date(`${data.eventDate}T${data.eventTime}:00`).toISOString();
    await updateEvent.mutateAsync({
      id: eventId,
      data: {
        eventDate, durationMin: data.durationMin,
        venueType: data.venueType,
        venueId: data.venueId || undefined,
        customVenueName: data.customVenueName,
        customVenueAddress: data.customVenueAddress,
        customVenueCity: data.customVenueCity,
        customVenueLatitude: data.customVenueLatitude,
        customVenueLongitude: data.customVenueLongitude,
      } as never,
    });
    setStep(3);
  }

  async function handleStep3() {
    if (!eventId) return;
    await updateEvent.mutateAsync({
      id: eventId,
      data: {
        priceTiersJson: JSON.stringify(tiers),
        artistsJson: JSON.stringify(artists.filter(a => a.name.trim())),
      } as never,
    });
    setStep(4);
  }

  async function handleUpload(file: File, type: 'poster' | 'backdrop') {
    if (!eventId) return;
    const result = await uploadImage.mutateAsync({ eventId, file, type });
    if (type === 'poster')   setPosterUrl(result.posterUrl ?? null);
    else                      setBackdropUrl(result.backdropUrl ?? null);
  }

  async function handleSubmitFinal() {
    if (!eventId) return;
    await submitEvent.mutateAsync(eventId);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <LysLayout>
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="font-display font-bold text-2xl text-text-primary mb-3">Event Submitted!</h2>
        <p className="text-text-muted text-sm mb-8">
          Our team will review your submission within 2 business days and email you with the decision.
        </p>
        <button
          onClick={() => navigate('/list-your-show/my-events')}
          className="px-6 py-2.5 bg-gradient-to-r from-accent-indigo to-[#7C3AED] text-white font-semibold rounded-full text-sm"
        >
          View My Events →
        </button>
      </div>
      </LysLayout>
    );
  }

  return (
    <LysLayout>
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl text-text-primary mb-6">
        {editId ? 'Edit Event' : 'Create New Event'}
      </h1>
      <ProgressBar step={step} />

      {/* Step 1 — Basic Info */}
      {step === 1 && (
        <form onSubmit={step1Form.handleSubmit(handleStep1)} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Event Title</label>
            <input {...step1Form.register('title')}
              className="w-full px-4 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
            {step1Form.formState.errors.title && (
              <p className="text-semantic-error text-xs mt-1">{step1Form.formState.errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Event Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LYS_EVENT_TYPES.map((t) => (
                <label key={t.value}
                  className={`cursor-pointer border rounded-lg p-3 text-center text-sm transition-colors ${
                    step1Form.watch('type') === t.value
                      ? 'border-accent-indigo bg-accent-indigo/10 text-accent-indigo'
                      : 'border-border-default text-text-secondary hover:border-border-strong'
                  }`}>
                  <input type="radio" {...step1Form.register('type')} value={t.value} className="sr-only" />
                  {t.label}
                </label>
              ))}
            </div>
            {step1Form.formState.errors.type && (
              <p className="text-semantic-error text-xs mt-1">{step1Form.formState.errors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Description <span className="text-text-muted font-normal">(min 50 chars)</span>
            </label>
            <textarea {...step1Form.register('description')} rows={4}
              className="w-full px-4 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo resize-none" />
            {step1Form.formState.errors.description && (
              <p className="text-semantic-error text-xs mt-1">{step1Form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Language</label>
              <select {...step1Form.register('language')}
                className="w-full px-3 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo">
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Age Restriction</label>
              <select {...step1Form.register('ageRestriction')}
                className="w-full px-3 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo">
                <option value={0}>All Ages</option>
                <option value={12}>12+</option>
                <option value={16}>16+</option>
                <option value={18}>18+</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={createEvent.isPending || updateEvent.isPending}
            className="w-full py-3 bg-gradient-to-r from-accent-indigo to-[#7C3AED] text-white font-semibold rounded-full text-sm disabled:opacity-60">
            Next: Date & Venue →
          </button>
        </form>
      )}

      {/* Step 2 — Date & Venue */}
      {step === 2 && (
        <form onSubmit={step2Form.handleSubmit(handleStep2)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Event Date</label>
              <input type="date" {...step2Form.register('eventDate')}
                min={new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Event Time</label>
              <input type="time" {...step2Form.register('eventTime')} step={900}
                className="w-full px-4 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Duration (minutes, optional)</label>
            <input type="number" {...step2Form.register('durationMin')} min={1} placeholder="e.g. 120"
              className="w-full px-4 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Venue Type</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'custom', label: 'Custom Venue' },
                { value: 'existing', label: 'Registered Cinema/Venue' },
              ].map((v) => (
                <label key={v.value}
                  className={`cursor-pointer border rounded-lg p-3 text-center text-sm transition-colors ${
                    step2Form.watch('venueType') === v.value
                      ? 'border-accent-indigo bg-accent-indigo/10 text-accent-indigo'
                      : 'border-border-default text-text-secondary hover:border-border-strong'
                  }`}>
                  <input type="radio" {...step2Form.register('venueType')} value={v.value} className="sr-only" />
                  {v.label}
                </label>
              ))}
            </div>
          </div>

          {step2Form.watch('venueType') === 'existing' && (
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">Select Venue</label>
              <select {...step2Form.register('venueId')}
                className="w-full px-4 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo">
                <option value="">— Choose a venue —</option>
                {(venueOptions ?? []).map((v) => (
                  <option key={v.id} value={v.id}>{v.name} — {v.cityName}</option>
                ))}
              </select>
              {venueOptions?.length === 0 && (
                <p className="text-xs text-text-muted mt-1">No registered venues found.</p>
              )}
            </div>
          )}

          {step2Form.watch('venueType') === 'custom' && (
            <div className="space-y-3">
              <input {...step2Form.register('customVenueName')} placeholder="Venue name"
                className="w-full px-4 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
              <input {...step2Form.register('customVenueAddress')} placeholder="Full address"
                className="w-full px-4 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
              <input {...step2Form.register('customVenueCity')} placeholder="City"
                className="w-full px-4 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1">Latitude <span className="text-text-muted">(optional)</span></label>
                  <input type="number" step="any" {...step2Form.register('customVenueLatitude')}
                    placeholder="e.g. 19.0760"
                    className="w-full px-4 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1">Longitude <span className="text-text-muted">(optional)</span></label>
                  <input type="number" step="any" {...step2Form.register('customVenueLongitude')}
                    placeholder="e.g. 72.8777"
                    className="w-full px-4 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
                </div>
              </div>
              <p className="text-xs text-text-muted">Coordinates enable a Google Maps link on your event page.</p>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)}
              className="flex-1 py-3 bg-bg-surface2 border border-border-default text-text-secondary font-semibold rounded-full text-sm hover:text-text-primary">
              ← Back
            </button>
            <button type="submit" disabled={updateEvent.isPending}
              className="flex-1 py-3 bg-gradient-to-r from-accent-indigo to-[#7C3AED] text-white font-semibold rounded-full text-sm disabled:opacity-60">
              Next: Artists & Tickets →
            </button>
          </div>
        </form>
      )}

      {/* Step 3 — Artists & Tickets */}
      {step === 3 && (
        <div className="space-y-6">
          <ArtistEditor artists={artists} onChange={setArtists} />

          <div className="border-t border-border-default" />

          <TierEditor tiers={tiers} onChange={setTiers} />

          {/* Commission preview */}
          <div className="bg-accent-indigo/8 border border-accent-indigo/20 rounded-xl p-4 text-sm text-text-muted">
            <p className="text-text-primary font-semibold mb-1">Commission Preview</p>
            <p>BookKaroo takes <span className="text-accent-indigo font-semibold">{rate}%</span> per ticket.</p>
            {tiers[0]?.price > 0 && (
              <p className="mt-1">
                For ₹{tiers[0].price}: BookKaroo earns ₹{(tiers[0].price * rate / 100).toFixed(0)}, you receive ₹{(tiers[0].price * (1 - rate / 100)).toFixed(0)}.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)}
              className="flex-1 py-3 bg-bg-surface2 border border-border-default text-text-secondary font-semibold rounded-full text-sm hover:text-text-primary">
              ← Back
            </button>
            <button type="button" onClick={handleStep3} disabled={updateEvent.isPending}
              className="flex-1 py-3 bg-gradient-to-r from-accent-indigo to-[#7C3AED] text-white font-semibold rounded-full text-sm disabled:opacity-60">
              Next: Images →
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Images */}
      {step === 4 && (
        <div className="space-y-6">
          {/* Poster upload */}
          <div>
            <h3 className="font-semibold text-text-primary text-sm mb-2">
              Event Poster <span className="text-semantic-error">*</span>
            </h3>
            <p className="text-text-muted text-xs mb-3">JPG, PNG, WebP · Max 5MB · Recommended: 2:3 ratio</p>
            {posterUrl ? (
              <div className="flex items-center gap-4">
                <img src={getPosterUrl(posterUrl, 'w92')} alt="Poster" className="w-16 h-24 object-cover rounded-lg" />
                <button type="button" onClick={() => posterInputRef.current?.click()}
                  className="text-xs text-accent-indigo hover:underline">
                  Change
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => posterInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border-default rounded-xl py-10 text-center hover:border-accent-indigo transition-colors">
                <span className="text-3xl block mb-2">🖼</span>
                <span className="text-sm text-text-muted">Click to upload poster</span>
              </button>
            )}
            <input ref={posterInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, 'poster'); }} />
          </div>

          {/* Backdrop upload */}
          <div>
            <h3 className="font-semibold text-text-primary text-sm mb-2">
              Banner Image <span className="text-text-muted font-normal">(optional)</span>
            </h3>
            <p className="text-text-muted text-xs mb-3">Recommended: 16:9 ratio</p>
            {backdropUrl ? (
              <div className="flex items-center gap-4">
                <img src={backdropUrl} alt="Backdrop" className="h-12 rounded object-cover" style={{ aspectRatio: '16/9' }} />
                <button type="button" onClick={() => backdropInputRef.current?.click()}
                  className="text-xs text-accent-indigo hover:underline">
                  Change
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => backdropInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border-default rounded-xl py-8 text-center hover:border-accent-indigo transition-colors">
                <span className="text-sm text-text-muted">Click to upload banner (optional)</span>
              </button>
            )}
            <input ref={backdropInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, 'backdrop'); }} />
          </div>

          {/* Checklist */}
          <div className="bg-bg-surface2 rounded-xl p-4 space-y-2">
            {[
              { ok: !!step1Form.getValues('title'), label: 'Event title and description' },
              { ok: tiers.length > 0 && tiers[0].capacity > 0, label: 'At least one ticket tier' },
              { ok: !!posterUrl, label: 'Event poster uploaded' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                <span className={item.ok ? 'text-green-400' : 'text-semantic-error'}>
                  {item.ok ? '✓' : '✗'}
                </span>
                <span className={item.ok ? 'text-text-secondary' : 'text-text-muted'}>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={() => setStep(3)}
              className="flex-1 py-3 bg-bg-surface2 border border-border-default text-text-secondary font-semibold rounded-full text-sm hover:text-text-primary">
              ← Back
            </button>
            <button type="button"
              onClick={() => navigate('/list-your-show/my-events')}
              className="flex-1 py-3 border border-border-default text-text-secondary font-semibold rounded-full text-sm hover:text-text-primary">
              Save as Draft
            </button>
            <button type="button"
              onClick={handleSubmitFinal}
              disabled={!posterUrl || submitEvent.isPending}
              className="flex-1 py-3 bg-gradient-to-r from-accent-indigo to-[#7C3AED] text-white font-semibold rounded-full text-sm disabled:opacity-60">
              {submitEvent.isPending ? 'Submitting…' : 'Submit for Review'}
            </button>
          </div>
        </div>
      )}
    </div>
    </LysLayout>
  );
}
