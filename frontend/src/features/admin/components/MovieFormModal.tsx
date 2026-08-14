import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Check } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { cn } from '@/shared/lib/utils';
import { useSyncFromTmdb, useImportPopular, useCreateMovie, useUpdateMovie } from '../api/useAdmin';
import type { AdminMovieDetailResponse, CreateMoviePayload } from '../types';

const LANGUAGES = ['Hindi', 'English', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Marathi', 'Bengali', 'Punjabi', 'Gujarati'];
const FORMATS   = ['2D', '3D', 'IMAX', 'IMAX-3D', '4DX', 'Dolby Cinema'];
const GENRES    = ['Action', 'Comedy', 'Drama', 'Romance', 'Thriller', 'Horror', 'Sci-Fi', 'Animation', 'Documentary', 'Biography', 'Musical'];
const STATUSES  = ['Draft', 'Published', 'Archived'];
const CATEGORIES = ['NowShowing', 'ComingSoon', 'Exclusive', 'Premiere'];
const CATEGORY_LABELS: Record<string, string> = {
  NowShowing: 'Now Showing', ComingSoon: 'Coming Soon', Exclusive: 'Exclusive', Premiere: 'Premiere',
};
const CERTS = ['U', 'UA', 'A', 'S'];

interface ChipSelectProps {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  labelMap?: Record<string, string>;
}

function ChipSelect({ options, value, onChange, labelMap }: ChipSelectProps) {
  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value.includes(opt);
        return (
          <button
            key={opt} type="button" onClick={() => toggle(opt)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-sans border-2 transition-all duration-150',
              selected
                ? 'border-accent-indigo text-accent-indigo bg-accent-indigo/10'
                : 'border-border-default text-text-muted hover:border-border-strong hover:text-text-secondary',
            )}
          >
            <span className={cn(
              'w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 transition-colors',
              selected ? 'bg-accent-indigo border-accent-indigo' : 'border-border-strong',
            )}>
              {selected && <Check size={9} strokeWidth={3} className="text-white" />}
            </span>
            {labelMap?.[opt] ?? opt}
          </button>
        );
      })}
    </div>
  );
}

interface RadioChipsProps {
  options:   string[];
  value:     string;
  onChange:  (v: string) => void;
  labelMap?: Record<string, string>;
}

function RadioChips({ options, value, onChange, labelMap }: RadioChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt} type="button" onClick={() => onChange(opt)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-sans border-2 transition-all duration-150',
              selected
                ? 'border-accent-crimson text-accent-crimson bg-accent-crimson/10'
                : 'border-border-default text-text-muted hover:border-border-strong hover:text-text-secondary',
            )}
          >
            <span className={cn(
              'w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
              selected ? 'border-accent-crimson' : 'border-border-strong',
            )}>
              {selected && <span className="w-1.5 h-1.5 rounded-full bg-accent-crimson" />}
            </span>
            {labelMap?.[opt] ?? opt}
          </button>
        );
      })}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-sm text-text-primary font-sans focus:outline-none focus:border-accent-indigo [color-scheme:dark]';
const labelCls = 'block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1';
const sectionCls = 'border-t border-border-default pt-4 mt-4';

interface Props {
  mode:       'create' | 'edit';
  movie?:     AdminMovieDetailResponse;
  onClose:    () => void;
  onSuccess:  () => void;
}

export function MovieFormModal({ mode, movie, onClose, onSuccess }: Props) {
  const [tmdbIdInput, setTmdbIdInput] = useState('');
  const createMutation  = useCreateMovie();
  const updateMutation  = useUpdateMovie();
  const syncMutation    = useSyncFromTmdb();
  const importMutation  = useImportPopular();

  const { register, handleSubmit, control, reset } = useForm<CreateMoviePayload>({
    defaultValues: {
      title: movie?.title ?? '', description: movie?.description ?? '',
      durationMin: movie?.durationMin ?? 120, certificate: movie?.certificate ?? '',
      languages: movie?.languages ?? ['Hindi'], formats: movie?.formats ?? ['2D'],
      genres: movie?.genres ?? [],
      releaseDate: movie?.releaseDate ?? '', posterUrl: movie?.posterUrl ?? '',
      backdropUrl: movie?.backdropUrl ?? '', trailerUrl: movie?.trailerUrl ?? '',
      imdbRating: movie?.imdbRating ?? undefined,
      status: movie?.status ?? 'Draft', category: movie?.category ?? 'NowShowing',
      cast: movie?.cast ?? '', crew: movie?.crew ?? '',
    },
  });

  async function handleTmdbSync() {
    const id = parseInt(tmdbIdInput, 10);
    if (!id) return;
    const result = await syncMutation.mutateAsync(id);
    reset({
      title: result.title,
      durationMin: result.durationMin,
      languages: result.languages,
      formats: result.formats,
      genres: result.genres,
      releaseDate: result.releaseDate ?? '',
      posterUrl: result.posterUrl ?? '',
      backdropUrl: result.backdropUrl ?? '',
      trailerUrl: result.trailerUrl ?? '',
      imdbRating: result.imdbRating ?? undefined,
      status: 'Draft',
      category: result.category,
    });
  }

  async function onSubmit(data: CreateMoviePayload) {
    if (mode === 'create') {
      await createMutation.mutateAsync(data);
    } else if (movie) {
      await updateMutation.mutateAsync({ id: movie.id, data });
    }
    onSuccess();
    onClose();
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal open onClose={onClose} maxWidth="max-w-3xl"
      title={mode === 'create' ? 'Add New Movie' : 'Edit Movie'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
        {/* TMDB sync — create mode only */}
        {mode === 'create' && (
          <div className="rounded-xl border border-accent-indigo/30 bg-accent-indigo/06 p-4 mb-5">
            <p className="text-[13px] font-semibold text-text-primary mb-2">Import from TMDB</p>
            <div className="flex gap-2">
              <input
                value={tmdbIdInput} onChange={(e) => setTmdbIdInput(e.target.value)}
                placeholder="TMDB movie ID (e.g. 1118640)"
                className={cn(inputCls, 'flex-1')}
              />
              <button type="button" onClick={handleTmdbSync} disabled={syncMutation.isPending}
                className="px-4 py-2 rounded-lg bg-accent-indigo text-white text-sm font-semibold font-sans disabled:opacity-60">
                {syncMutation.isPending ? 'Syncing…' : 'Sync'}
              </button>
            </div>
            <button type="button" onClick={() => importMutation.mutate()} disabled={importMutation.isPending}
              className="mt-2 text-xs text-accent-indigo font-sans hover:underline disabled:opacity-60">
              {importMutation.isPending ? 'Importing…' : 'Import Top 20 Popular Movies →'}
            </button>
          </div>
        )}

        {/* Basic Info */}
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className={labelCls}>Title *</label>
            <input {...register('title', { required: true })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea {...register('description')} rows={3} className={cn(inputCls, 'resize-none')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Certificate</label>
              <select {...register('certificate')} className={inputCls}>
                <option value="">— select —</option>
                {CERTS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Duration (min)</label>
              <input type="number" {...register('durationMin', { valueAsNumber: true })} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Release Date</label>
              <input type="date" {...register('releaseDate')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>IMDb Rating</label>
              <input type="number" step="0.1" min="0" max="10"
                {...register('imdbRating', { valueAsNumber: true })} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className={sectionCls}>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelCls}>Status</label>
              <Controller name="status" control={control} render={({ field }) => (
                <RadioChips options={STATUSES} value={field.value ?? 'Draft'}
                  onChange={(v) => field.onChange(v)} />
              )} />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <Controller name="category" control={control} render={({ field }) => (
                <RadioChips options={CATEGORIES} value={field.value ?? 'NowShowing'}
                  onChange={(v) => field.onChange(v)} labelMap={CATEGORY_LABELS} />
              )} />
            </div>
          </div>
        </div>

        {/* Languages & Formats */}
        <div className={sectionCls}>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelCls}>Languages</label>
              <Controller name="languages" control={control} render={({ field }) => (
                <ChipSelect options={LANGUAGES} value={field.value ?? []}
                  onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label className={labelCls}>Formats</label>
              <Controller name="formats" control={control} render={({ field }) => (
                <ChipSelect options={FORMATS} value={field.value ?? []}
                  onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label className={labelCls}>Genres</label>
              <Controller name="genres" control={control} render={({ field }) => (
                <ChipSelect options={GENRES} value={field.value ?? []}
                  onChange={field.onChange} />
              )} />
            </div>
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
            <div>
              <label className={labelCls}>Trailer URL (YouTube)</label>
              <input {...register('trailerUrl')} className={inputCls} placeholder="https://youtube.com/watch?v=..." />
            </div>
          </div>
        </div>

        {/* Cast / Crew */}
        <div className={sectionCls}>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelCls}>Cast JSON</label>
              <textarea {...register('cast')} rows={3} className={cn(inputCls, 'resize-none font-mono text-xs')}
                placeholder='[{"name":"Actor","role":"Character","photo":"url"}]' />
            </div>
            <div>
              <label className={labelCls}>Crew JSON</label>
              <textarea {...register('crew')} rows={3} className={cn(inputCls, 'resize-none font-mono text-xs')}
                placeholder='[{"name":"Director","role":"Director"}]' />
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
            {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create Movie' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
