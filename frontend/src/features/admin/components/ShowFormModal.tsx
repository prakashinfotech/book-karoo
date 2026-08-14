import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import { useCreateShow, useAdminVenueDetail } from '../api/useAdmin';
import type { AdminVenue } from '../types';

const FORMATS   = ['2D', '3D', 'IMAX', 'IMAX-3D', '4DX', 'Dolby Cinema', 'EPIQ', 'MX4D'];
const LANGUAGES = ['Hindi', 'English', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Marathi', 'Bengali', 'Punjabi', 'Gujarati'];

interface Movie { id: string; title: string; posterUrl?: string; certificate?: string; }
interface Event { id: string; title: string; type: string; eventDateLabel?: string; }

interface Props {
  onClose:           () => void;
  onSuccess:         () => void;
  prefilledVenueId?: string;
}

export function ShowFormModal({ onClose, onSuccess, prefilledVenueId }: Props) {
  const createShow = useCreateShow();

  const [type, setType]           = useState<'movie' | 'event'>('movie');
  const [movieSearch, setMovieSearch] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [venueId, setVenueId]     = useState(prefilledVenueId ?? '');
  const [screenId, setScreenId]   = useState('');
  const [showDate, setShowDate]   = useState('');
  const [showTime, setShowTime]   = useState('');
  const [format, setFormat]       = useState('2D');
  const [language, setLanguage]   = useState('Hindi');
  const [conflict, setConflict]   = useState<'checking' | 'clear' | 'conflict' | null>(null);

  const today = new Date().toISOString().split('T')[0];

  // Load ALL published movies once; filter client-side by search
  const { data: allMovies } = useQuery<{ items: Movie[] }>({
    queryKey: ['admin-movies-published'],
    queryFn: () =>
      api.get('/api/admin/movies', { params: { status: 'Published', pageSize: 200 } }).then((r) => r.data),
    staleTime: 5 * 60_000,
    enabled: type === 'movie',
  });

  const filteredMovies = (allMovies?.items ?? []).filter((m) =>
    !movieSearch.trim() || m.title.toLowerCase().includes(movieSearch.toLowerCase())
  );

  const { data: events } = useQuery<{ items: Event[] }>({
    queryKey: ['admin-events-published'],
    queryFn: () =>
      api.get('/api/events', { params: { status: 'Published', pageSize: 100 } }).then((r) => r.data),
    enabled: type === 'event',
  });

  const { data: venues } = useQuery<AdminVenue[]>({
    queryKey: ['admin-venues-all'],
    queryFn: () =>
      api.get('/api/admin/venues', { params: { pageSize: 100 } }).then((r) => (r.data as {items: AdminVenue[]}).items),
    staleTime: 2 * 60_000,
  });

  const { data: venueDetail } = useAdminVenueDetail(venueId || null);
  const screens = venueDetail?.screens ?? [];

  // Convert 12h showTimeLabel (e.g. "10:30 AM") to 24h "HH:mm"
  function showTimeLabelTo24h(label: string): string {
    const parts = label.trim().split(' ');
    if (parts.length < 2) return label.substring(0, 5);
    const [time, ampm] = parts;
    const [h, m] = time.split(':').map(Number);
    let hour = h;
    if (ampm.toUpperCase() === 'PM' && h !== 12) hour += 12;
    if (ampm.toUpperCase() === 'AM' && h === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  // Conflict check — fetch all shows for the screen+date, compare input time
  const { data: existingShows } = useQuery<{ items: Array<{ showTimeLabel: string }> }>({
    queryKey: ['admin-shows-conflict', screenId, showDate],
    queryFn: () =>
      api.get('/api/admin/shows', { params: { screenId, fromDate: showDate, toDate: showDate, pageSize: 50 } }).then((r) => r.data),
    enabled: !!(screenId && showDate),
    staleTime: 0,
  });

  useEffect(() => {
    if (!screenId || !showDate || !showTime) { setConflict(null); return; }
    if (!existingShows) { setConflict('checking'); return; }

    const inputHHmm = showTime.substring(0, 5); // e.g. "10:30"
    const hasConflict = (existingShows.items ?? []).some((s) => {
      const show24h = showTimeLabelTo24h(s.showTimeLabel ?? '');
      return show24h === inputHHmm;
    });
    setConflict(hasConflict ? 'conflict' : 'clear');
  }, [screenId, showDate, showTime, existingShows]);

  const canSubmit = (): boolean => {
    if (!screenId || !showDate || !showTime || !format || !language) return false;
    if (type === 'movie' && !selectedMovieId) return false;
    if (type === 'event' && !selectedEventId) return false;
    if (conflict === 'conflict') return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit()) return;
    await createShow.mutateAsync({
      screenId,
      movieId: type === 'movie' ? selectedMovieId : undefined,
      eventId: type === 'event' ? selectedEventId : undefined,
      showDate,
      showTime: showTime + ':00',
      format,
      language,
    });
    onSuccess();
    onClose();
  };

  const inputCls  = 'w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo';
  const selectCls = inputCls + ' [color-scheme:dark]';

  return (
    <Modal open onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-xl text-text-primary">Create Show</h2>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors"><X size={20} /></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type toggle */}
        <div className="flex rounded-lg border border-border-default overflow-hidden">
          {(['movie', 'event'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${type === t ? 'bg-accent-indigo text-white' : 'bg-bg-surface2 text-text-secondary hover:bg-bg-surface3'}`}
            >
              {t === 'movie' ? '🎬 Movie' : '🎭 Event'}
            </button>
          ))}
        </div>

        {/* Movie / Event selector */}
        {type === 'movie' ? (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Movie *</label>
            <input
              value={movieSearch}
              onChange={(e) => setMovieSearch(e.target.value)}
              placeholder="Type to filter movies…"
              className={inputCls + ' mb-2'}
            />
            {/* Custom scrollable list with highlighted selected item */}
            <div className="max-h-44 overflow-y-auto rounded-lg border border-border-default bg-bg-surface divide-y divide-border-default">
              {filteredMovies.length === 0 ? (
                <p className="px-3 py-3 text-xs text-text-muted text-center">
                  {movieSearch ? `No movies match "${movieSearch}"` : 'No published movies found'}
                </p>
              ) : filteredMovies.map((m) => {
                const isSelected = selectedMovieId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMovieId(m.id)}
                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-accent-indigo/10 text-accent-indigo font-semibold'
                        : 'text-text-primary hover:bg-bg-surface2'
                    }`}
                  >
                    <span className="truncate">{m.title}</span>
                    <span className="flex items-center gap-2 flex-shrink-0">
                      {m.certificate && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isSelected ? 'bg-accent-indigo/20 text-accent-indigo' : 'bg-bg-surface2 text-text-muted'}`}>
                          {m.certificate}
                        </span>
                      )}
                      {isSelected && <span className="text-accent-indigo text-base">✓</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedMovieId && (
              <p className="text-xs text-accent-indigo mt-1.5 font-medium">
                ✓ Selected: {filteredMovies.find(m => m.id === selectedMovieId)?.title ?? allMovies?.items?.find(m => m.id === selectedMovieId)?.title}
              </p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Event *</label>
            <div className="max-h-44 overflow-y-auto rounded-lg border border-border-default bg-bg-surface divide-y divide-border-default">
              {!events?.items?.length ? (
                <p className="px-3 py-3 text-xs text-text-muted text-center">No published events found</p>
              ) : events.items.map((ev) => {
                const isSelected = selectedEventId === ev.id;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setSelectedEventId(ev.id)}
                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-accent-indigo/10 text-accent-indigo font-semibold'
                        : 'text-text-primary hover:bg-bg-surface2'
                    }`}
                  >
                    <span className="truncate">{ev.title}</span>
                    <span className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono capitalize ${isSelected ? 'bg-accent-indigo/20 text-accent-indigo' : 'bg-bg-surface2 text-text-muted'}`}>
                        {ev.type}
                      </span>
                      {isSelected && <span className="text-accent-indigo text-base">✓</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedEventId && (
              <p className="text-xs text-accent-indigo mt-1.5 font-medium">
                ✓ Selected: {events?.items?.find(e => e.id === selectedEventId)?.title}
              </p>
            )}
          </div>
        )}

        {/* Venue + Screen */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Venue *</label>
            <select
              value={venueId}
              onChange={(e) => { setVenueId(e.target.value); setScreenId(''); }}
              className={selectCls}
            >
              <option value="">— Select Venue —</option>
              {venues?.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.cityName})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Screen *</label>
            <select
              value={screenId}
              onChange={(e) => setScreenId(e.target.value)}
              disabled={!venueId}
              className={selectCls + (!venueId ? ' opacity-50 cursor-not-allowed' : '')}
            >
              <option value="">{venueId ? '— Select Screen —' : 'Select a venue first'}</option>
              {screens.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.totalSeats} seats)</option>)}
            </select>
          </div>
        </div>

        {/* Date + Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Date *</label>
            <input type="date" min={today} value={showDate} onChange={(e) => setShowDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Time *</label>
            <input
              type="time"
              step={1800}
              value={showTime}
              onChange={(e) => setShowTime(e.target.value)}
              className={inputCls + (conflict === 'conflict' ? ' border-semantic-error' : '')}
            />
          </div>
        </div>

        {/* Conflict indicator */}
        {conflict === 'conflict' && (
          <p className="text-xs text-semantic-error">⚠️ This screen already has a show at this time.</p>
        )}
        {conflict === 'clear' && (
          <p className="text-xs text-semantic-success">✅ No conflicts</p>
        )}

        {/* Format + Language */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Format *</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)} className={selectCls}>
              {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Language *</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className={selectCls}>
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1 border-t border-border-default mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-md border border-border-strong text-text-secondary text-sm font-medium hover:bg-bg-surface2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit() || createShow.isPending}
            className="flex-1 px-5 py-2.5 rounded-md text-white text-sm font-semibold disabled:opacity-50 transition-colors"
            style={{ background: '#E11D74' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#B0165D'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#E11D74'; }}
          >
            {createShow.isPending ? 'Creating…' : 'Create Show'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
