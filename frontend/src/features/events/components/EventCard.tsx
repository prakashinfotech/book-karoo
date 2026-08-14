import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/shared/lib/utils';
import { ROUTES, TMDB_POSTER } from '@/shared/constants';
import type { EventListItem, EventKind } from '../types';

interface EventCardProps {
  event: EventListItem;
  size?: 'sm' | 'md';
}

const TYPE_CONFIG: Record<EventKind, { label: string; emoji: string; bgClass: string }> = {
  LiveEvent: { label: 'Concert',  emoji: '🎵', bgClass: 'bg-accent-indigo/85' },
  Play:      { label: 'Play',     emoji: '🎭', bgClass: 'bg-accent-purple/85' },
  Sport:     { label: 'Sport',    emoji: '🏏', bgClass: 'bg-semantic-warning/85' },
  Ipl:       { label: 'IPL',      emoji: '🏏', bgClass: 'bg-[#D4A017]/90' },
  Comedy:    { label: 'Comedy',   emoji: '😂', bgClass: 'bg-semantic-success/85' },
  Activity:  { label: 'Activity', emoji: '⚡', bgClass: 'bg-accent-indigo/85' },
};

export function EventCard({ event: e }: EventCardProps) {
  const [hovered, setHovered] = useState(false);

  const cfg     = TYPE_CONFIG[e.type] ?? TYPE_CONFIG.LiveEvent;
  const poster  = e.posterUrl ? TMDB_POSTER(e.posterUrl, 'w342') : null;
  const artists = e.artists.slice(0, 2).map((a) => a.name).join(', ');

  return (
    <Link
      to={ROUTES.EVENT_DETAIL(e.slug)}
      className="block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Poster */}
      <div
        className={cn(
          'relative aspect-[3/4] rounded-lg overflow-hidden bg-bg-surface2 border transition-all duration-[220ms] isolate',
          hovered
            ? 'border-border-strong -translate-y-1 shadow-[0_8px_24px_rgba(0,0,0,0.4),0_0_0_1px_rgba(99,102,241,0.3)]'
            : 'border-border-default',
        )}
      >
        {poster ? (
          <img
            src={poster}
            alt={e.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(ev) => { (ev.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : null}

        {/* Fallback gradient behind image */}
        <div className="absolute inset-0 bg-gradient-to-br from-bg-surface2 to-bg-surface3 flex flex-col items-center justify-center -z-10">
          <span className="text-4xl">{cfg.emoji}</span>
        </div>

        {/* Type badge top-left */}
        <div className={cn('absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-sans text-white backdrop-blur-sm', cfg.bgClass)}>
          {cfg.emoji} {cfg.label}
        </div>

        {/* Age restriction top-right */}
        {e.ageRestriction > 0 && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-accent-crimson/85 backdrop-blur-sm text-[11px] font-semibold text-white font-sans">
            {e.ageRestriction}+
          </div>
        )}

        {/* Bottom overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3">
          <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-semantic-warning/20 text-semantic-warning text-[10px] font-semibold font-sans mb-1">
            {e.eventDateLabel}
          </div>
          <p className="font-display font-bold text-sm text-white line-clamp-2 leading-snug">
            {e.title}
          </p>
          <p className="text-[11px] text-white/60 font-sans line-clamp-1 mt-0.5">
            {e.venueName}
          </p>
        </div>

        {/* Hover overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-bg-base/95 via-bg-base/40 to-transparent flex flex-col justify-end p-3 transition-opacity duration-[220ms]',
            hovered ? 'opacity-100' : 'opacity-0',
          )}
        >
          <button className="w-full py-2 rounded-full bg-gradient-to-r from-accent-indigo to-accent-purple text-white text-xs font-semibold font-sans">
            🎟 Book Now
          </button>
        </div>
      </div>

      {/* Meta below poster */}
      <div className="pt-2.5 space-y-0.5">
        <p className="font-display font-semibold text-sm text-text-primary leading-snug line-clamp-1">
          {e.title}
        </p>
        <div className="flex items-center justify-between gap-1">
          {e.lowestPrice > 0 ? (
            <p className="text-xs text-semantic-success font-semibold font-sans">
              from ₹{e.lowestPrice.toLocaleString('en-IN')}
            </p>
          ) : (
            <p className="text-xs text-text-muted font-sans">Free</p>
          )}
        </div>
        {artists && (
          <p className="text-[11px] text-text-muted font-sans line-clamp-1">{artists}</p>
        )}
      </div>
    </Link>
  );
}
