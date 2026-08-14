import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/shared/components/ui/Modal';
import { cn } from '@/shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import { useCreateVenue, useUpdateVenue } from '../api/useAdmin';
import type { AdminVenue } from '../types';

const CHAINS = ['PVR', 'INOX', 'Cinepolis', 'Rajhans', 'Carnival', 'Miraj', 'SPI', 'Other'];

const AMENITY_OPTIONS = [
  { value: 'Parking',          label: '🅿 Parking' },
  { value: 'Food Court',       label: '🍿 Food Court' },
  { value: 'M-Ticket',         label: '📱 M-Ticket' },
  { value: 'Wheelchair Access',label: '♿ Wheelchair Access' },
  { value: 'Recliner',         label: '🛋 Recliner' },
  { value: 'Dolby Atmos',      label: '🎵 Dolby Atmos' },
  { value: 'IMAX',             label: '🎬 IMAX' },
  { value: '4DX',              label: '4DX' },
  { value: 'Subtitles',        label: '💬 Subtitles' },
  { value: 'Valet Parking',    label: '🚗 Valet Parking' },
  { value: 'ATM',              label: '🏧 ATM' },
];

const schema = z.object({
  name:         z.string().min(3).max(200),
  chain:        z.string().optional(),
  customChain:  z.string().optional(),
  address:      z.string().min(10).max(500),
  cityId:       z.string().uuid('Please select a city'),
  latitude:     z.number().min(-90).max(90).optional(),
  longitude:    z.number().min(-180).max(180).optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  amenities:    z.array(z.string()),
  isActive:     z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  mode:      'create' | 'edit';
  venue?:    AdminVenue;
  onClose:   () => void;
  onSuccess: () => void;
}

interface City { id: string; name: string; state: string; }

export function VenueFormModal({ mode, venue, onClose, onSuccess }: Props) {
  const { data: cities } = useQuery<City[]>({
    queryKey: ['cities'],
    queryFn: () => api.get<City[]>('/api/cities').then((r) => r.data),
    staleTime: 10 * 60_000,
  });

  const createMutation = useCreateVenue();
  const updateMutation = useUpdateVenue();
  const isLoading = createMutation.isPending || updateMutation.isPending;

  const [showCustomChain, setShowCustomChain] = useState(
    venue?.chain != null && !CHAINS.slice(0, -1).includes(venue.chain)
  );

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:         venue?.name ?? '',
      chain:        venue?.chain ? (CHAINS.includes(venue.chain) ? venue.chain : 'Other') : '',
      customChain:  venue?.chain && !CHAINS.slice(0, -1).includes(venue.chain) ? venue.chain : '',
      address:      venue?.address ?? '',
      cityId:       venue?.cityId ?? '',
      latitude:     venue?.latitude || undefined,
      longitude:    venue?.longitude || undefined,
      contactPhone: venue?.contactPhone ?? '',
      contactEmail: venue?.contactEmail ?? '',
      amenities:    venue?.amenities ?? [],
      isActive:     venue?.isActive ?? true,
    },
  });

  const selectedAmenities = watch('amenities');
  const selectedChain     = watch('chain');
  const lat               = watch('latitude');
  const lng               = watch('longitude');

  const toggleAmenity = (value: string) => {
    const current = selectedAmenities ?? [];
    setValue('amenities', current.includes(value)
      ? current.filter((a) => a !== value)
      : [...current, value]);
  };

  const onSubmit = handleSubmit(async (data) => {
    const chainValue = data.chain === 'Other' ? (data.customChain || undefined) : data.chain || undefined;
    const payload = {
      name:         data.name,
      chain:        chainValue,
      address:      data.address,
      cityId:       data.cityId,
      latitude:     data.latitude,
      longitude:    data.longitude,
      contactPhone: data.contactPhone || undefined,
      contactEmail: data.contactEmail || undefined,
      amenities:    data.amenities,
      isActive:     data.isActive,
    };

    if (mode === 'create') {
      await createMutation.mutateAsync(payload);
    } else {
      await updateMutation.mutateAsync({ id: venue!.id, data: payload });
    }
    onSuccess();
    onClose();
  });

  return (
    <Modal open onClose={onClose} maxWidth="max-w-2xl"
      title={mode === 'create' ? 'Add New Venue' : 'Edit Venue'}>
      <form onSubmit={onSubmit} className="space-y-5">
        {/* Basic Information */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Basic Information</h3>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Venue Name *</label>
            <input {...register('name')} className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo" placeholder="e.g. PVR Acropolis" />
            {errors.name && <p className="text-xs text-semantic-error mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Chain</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {CHAINS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setValue('chain', c); setShowCustomChain(c === 'Other'); }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border-2 transition-all',
                    selectedChain === c
                      ? 'border-accent-crimson bg-accent-crimson text-white'
                      : 'border-border-default text-text-secondary hover:border-accent-indigo'
                  )}
                >{c}</button>
              ))}
            </div>
            {showCustomChain && (
              <input {...register('customChain')} placeholder="Enter chain name" className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Address *</label>
            <textarea {...register('address')} rows={3} className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo resize-none" placeholder="Full venue address" />
            {errors.address && <p className="text-xs text-semantic-error mt-1">{errors.address.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">City *</label>
            <select {...register('cityId')} className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo [color-scheme:dark]">
              <option value="">— Select City —</option>
              {cities?.map((c) => <option key={c.id} value={c.id}>{c.name}, {c.state}</option>)}
            </select>
            {errors.cityId && <p className="text-xs text-semantic-error mt-1">{errors.cityId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Contact Phone</label>
              <input {...register('contactPhone')} className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo" placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Contact Email</label>
              <input {...register('contactEmail')} type="email" className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo" placeholder="venue@example.com" />
              {errors.contactEmail && <p className="text-xs text-semantic-error mt-1">{errors.contactEmail.message}</p>}
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Location (optional)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Latitude</label>
              <input {...register('latitude', { valueAsNumber: true })} type="number" step="0.000001" className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo" placeholder="23.022505" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Longitude</label>
              <input {...register('longitude', { valueAsNumber: true })} type="number" step="0.000001" className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo" placeholder="72.571362" />
            </div>
          </div>
          {lat && lng && !isNaN(lat) && !isNaN(lng) && (
            <p className="text-xs text-semantic-success">Location set: {lat.toFixed(6)}, {lng.toFixed(6)}</p>
          )}
        </section>

        {/* Amenities */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Amenities</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AMENITY_OPTIONS.map((a) => {
              const active = selectedAmenities?.includes(a.value);
              return (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => toggleAmenity(a.value)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm border-2 text-left transition-all',
                    active
                      ? 'border-accent-crimson bg-accent-crimson/15 text-accent-crimson font-semibold'
                      : 'border-border-default bg-bg-surface2 text-text-secondary hover:border-accent-indigo'
                  )}
                >
                  <span className={cn(
                    'flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center text-[10px] font-bold transition-all',
                    active
                      ? 'border-accent-crimson bg-accent-crimson text-white'
                      : 'border-border-default'
                  )}>
                    {active ? '✓' : ''}
                  </span>
                  {a.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Status */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Status</h3>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <div
                className="flex items-center gap-3 cursor-pointer select-none w-fit"
                onClick={() => field.onChange(!field.value)}
              >
                <div className={cn(
                  'relative w-14 h-7 rounded-full transition-colors duration-200 flex-shrink-0',
                  field.value ? 'bg-semantic-success' : 'bg-bg-surface3 border border-border-default'
                )}>
                  <div className={cn(
                    'absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-transform duration-200',
                    field.value ? 'translate-x-[28px]' : 'translate-x-[3px]'
                  )} />
                </div>
                <span className={cn(
                  'text-sm font-medium',
                  field.value ? 'text-semantic-success' : 'text-text-muted'
                )}>
                  {field.value ? 'Active' : 'Inactive'}
                </span>
              </div>
            )}
          />
        </section>

        {/* Footer */}
        <div className="flex gap-3 pt-3 border-t border-border-default sticky bottom-0 bg-white pb-1">
          <button type="button" onClick={onClose} className="bk-btn-cancel">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="bk-btn-primary flex-1"
            style={{ background: '#E11D74' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#B0165D'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#E11D74'; }}
          >
            {isLoading ? 'Saving…' : mode === 'create' ? 'Create Venue' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
