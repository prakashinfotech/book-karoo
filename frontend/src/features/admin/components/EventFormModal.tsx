import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { cn } from '@/shared/lib/utils';
import { useCreateEvent, useUpdateEvent, useAdminVenuesList } from '../api/useAdmin';
import type { AdminEventDetailResponse, CreateEventPayload } from '../types';

const EVENT_TYPES = [
  { value: 'LiveEvent', label: 'Live Event' },
  { value: 'Play',      label: 'Play' },
  { value: 'Sport',     label: 'Sport' },
  { value: 'Activity',  label: 'Activity' },
  { value: 'Comedy',    label: 'Comedy' },
  { value: 'Ipl',       label: 'IPL' },
];
const STATUSES = ['Draft', 'Published', 'Archived'];
const TIER_COLORS = ['#E11D48', '#6366F1', '#F59E0B', '#22C55E', '#A855F7', '#0EA5E9'];

const inputCls = 'w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-sm text-text-primary font-sans focus:outline-none focus:border-accent-indigo [color-scheme:dark]';
const labelCls = 'block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1';
const sectionCls = 'border-t border-border-default pt-4 mt-4';

interface PriceTier { name: string; price: number; capacity: number; color: string; }

interface FormValues extends Omit<CreateEventPayload, 'priceTiers'> {
  priceTiersArr: PriceTier[];
}

function parseDefaultTiers(json: string | null | undefined): PriceTier[] {
  if (!json) return [{ name: 'General', price: 500, capacity: 200, color: '#E11D48' }];
  try { return JSON.parse(json); } catch { return []; }
}

interface Props {
  mode:      'create' | 'edit';
  event?:    AdminEventDetailResponse;
  onClose:   () => void;
  onSuccess: () => void;
}

export function EventFormModal({ mode, event, onClose, onSuccess }: Props) {
  const { data: venues } = useAdminVenuesList();
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();

  const defaultDate = event?.eventDate
    ? new Date(event.eventDate).toISOString().slice(0, 16)
    : '';

  const { register, handleSubmit, control } = useForm<FormValues>({
    defaultValues: {
      title:          event?.title      ?? '',
      type:           event?.type       ?? 'LiveEvent',
      description:    event?.description ?? '',
      venueId:        event?.venueId    ?? '',
      eventDate:      defaultDate,
      durationMin:    event?.durationMin ?? 0,
      language:       event?.language   ?? '',
      ageRestriction: event?.ageRestriction ?? 0,
      organizer:      event?.organizer  ?? '',
      artists:        event?.artists    ?? '',
      posterUrl:      event?.posterUrl  ?? '',
      backdropUrl:    event?.backdropUrl ?? '',
      status:         event?.status     ?? 'Draft',
      priceTiersArr:  parseDefaultTiers(event?.priceTiers),
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'priceTiersArr' });

  async function onSubmit(data: FormValues) {
    const priceTiers = JSON.stringify(data.priceTiersArr);
    const payload: CreateEventPayload = {
      ...data,
      venueId: data.venueId || undefined,
      priceTiers,
    };

    if (mode === 'create') {
      await createMutation.mutateAsync(payload);
    } else if (event) {
      await updateMutation.mutateAsync({ id: event.id, data: payload });
    }
    onSuccess();
    onClose();
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal open onClose={onClose} maxWidth="max-w-3xl"
      title={mode === 'create' ? 'Add New Event' : 'Edit Event'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">

        {/* Basic Info */}
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className={labelCls}>Title *</label>
            <input {...register('title', { required: true })} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Type *</label>
              <select {...register('type', { required: true })} className={inputCls}>
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select {...register('status')} className={inputCls}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea {...register('description')} rows={3} className={cn(inputCls, 'resize-none')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Language</label>
              <input {...register('language')} className={inputCls} placeholder="Hindi" />
            </div>
            <div>
              <label className={labelCls}>Age Restriction</label>
              <input type="number" {...register('ageRestriction', { valueAsNumber: true })} className={inputCls} placeholder="0 = all ages" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Duration (min, optional)</label>
            <input type="number" {...register('durationMin', { valueAsNumber: true })} className={inputCls} />
          </div>
        </div>

        {/* Schedule */}
        <div className={sectionCls}>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelCls}>Event Date &amp; Time *</label>
              <input type="datetime-local" {...register('eventDate', { required: true })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Venue</label>
              <select {...register('venueId')} className={inputCls}>
                <option value="">— select venue —</option>
                {(venues ?? []).map((v) => (
                  <option key={v.id} value={v.id}>{v.name} — {v.cityName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Artists */}
        <div className={sectionCls}>
          <div>
            <label className={labelCls}>Artists JSON</label>
            <textarea {...register('artists')} rows={3} className={cn(inputCls, 'resize-none font-mono text-xs')}
              placeholder='[{"name":"Arijit Singh","type":"Vocalist"}]' />
          </div>
        </div>

        {/* Organizer */}
        <div className={sectionCls}>
          <div>
            <label className={labelCls}>Organizer JSON</label>
            <textarea {...register('organizer')} rows={2} className={cn(inputCls, 'resize-none font-mono text-xs')}
              placeholder='{"name":"BookKaroo Events","contact":"events@bookkaroo.com"}' />
          </div>
        </div>

        {/* Price Tiers */}
        <div className={sectionCls}>
          <div className="flex items-center justify-between mb-2">
            <span className={labelCls}>Price Tiers</span>
            <button type="button"
              onClick={() => append({ name: '', price: 0, capacity: 100, color: TIER_COLORS[fields.length % TIER_COLORS.length] })}
              className="flex items-center gap-1 text-xs text-accent-indigo font-semibold font-sans hover:underline">
              <Plus size={12} /> Add Tier
            </button>
          </div>
          <div className="space-y-2">
            {fields.map((field, i) => (
              <div key={field.id} className="flex gap-2 items-center">
                <input {...register(`priceTiersArr.${i}.name`)} placeholder="Tier name"
                  className={cn(inputCls, 'flex-1')} />
                <input type="number" {...register(`priceTiersArr.${i}.price`, { valueAsNumber: true })}
                  placeholder="₹ Price" className={cn(inputCls, 'w-28')} />
                <input type="number" {...register(`priceTiersArr.${i}.capacity`, { valueAsNumber: true })}
                  placeholder="Capacity" className={cn(inputCls, 'w-28')} />
                <button type="button" onClick={() => remove(i)} className="text-semantic-error hover:opacity-70">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Media */}
        <div className={sectionCls}>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelCls}>Poster URL</label>
              <input {...register('posterUrl')} className={inputCls} placeholder="https://..." />
            </div>
            <div>
              <label className={labelCls}>Backdrop URL</label>
              <input {...register('backdropUrl')} className={inputCls} placeholder="https://..." />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-5 mt-4 border-t border-border-default">
          <button type="button" onClick={onClose} className="bk-btn-cancel">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bk-btn-primary"
            style={{ background: '#E11D74' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#B0165D'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#E11D74'; }}
          >
            {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create Event' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
