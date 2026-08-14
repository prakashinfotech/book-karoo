import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { getPosterUrl } from '@/shared/lib/imageUtils';
import { useMyOrganizerProfile, useMyLysEvents, useSubmitLysEvent, useDeleteLysEvent } from '../api/useLys';
import { LYS_STATUS_CONFIG } from '../types';
import type { LysEventListItem } from '../types';
import { LysLayout } from '../components/LysLayout';

const TABS: { label: string; value: string }[] = [
  { label: 'All',              value: 'all' },
  { label: 'Drafts',           value: 'draft' },
  { label: 'Submitted',        value: 'submitted' },
  { label: 'Changes Needed',   value: 'changes_requested' },
  { label: 'Live',             value: 'published' },
  { label: 'Rejected',         value: 'rejected' },
];

function EventRow({ event }: { event: LysEventListItem }) {
  const submit    = useSubmitLysEvent();
  const remove    = useDeleteLysEvent();
  const config    = LYS_STATUS_CONFIG[event.status];

  return (
    <div className="bg-bg-surface border border-border-default rounded-xl p-4 flex gap-4 items-start">
      {/* Poster */}
      <div className="w-16 h-24 rounded-lg overflow-hidden bg-bg-surface2 flex-shrink-0">
        {event.posterUrl ? (
          <img
            src={getPosterUrl(event.posterUrl, 'w92')}
            alt={event.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent-indigo/20 to-accent-purple/20 flex items-center justify-center text-xl">
            🎭
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-text-primary text-sm leading-snug line-clamp-1">
          {event.title}
        </p>
        <p className="text-text-muted text-xs mt-0.5">{event.eventDateLabel}</p>

        <span
          className="inline-block mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent-crimson text-white"
        >
          {config.label}
        </span>

        {(event.status === 'changes_requested' || event.status === 'rejected') && event.reviewNotes && (
          <div className="mt-2 flex items-start gap-1.5 text-xs">
            <AlertCircle size={12} className="flex-shrink-0 mt-0.5 text-amber-400" />
            <p className="text-amber-300 line-clamp-2">{event.reviewNotes}</p>
          </div>
        )}

        {event.lowestPrice > 0 && (
          <p className="text-text-muted text-xs mt-1.5">
            From ₹{event.lowestPrice.toLocaleString('en-IN')}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        {event.status === 'draft' && (
          <>
            <Link
              to={`/list-your-show/events/${event.id}/edit`}
              className="text-xs px-3 py-1.5 bg-bg-surface2 border border-border-default rounded-lg text-text-secondary hover:text-text-primary transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={() => submit.mutate(event.id)}
              disabled={submit.isPending}
              className="text-xs px-3 py-1.5 bg-accent-indigo text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              Submit
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this draft?')) remove.mutate(event.id);
              }}
              className="text-xs px-3 py-1.5 bg-bg-surface2 border border-semantic-error/40 rounded-lg text-semantic-error hover:bg-semantic-error/10 transition-colors"
            >
              Delete
            </button>
          </>
        )}
        {event.status === 'changes_requested' && (
          <Link
            to={`/list-your-show/events/${event.id}/edit`}
            className="text-xs px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-300 hover:opacity-90"
          >
            Edit & Resubmit
          </Link>
        )}
        {(event.status === 'submitted' || event.status === 'rejected') && (
          <Link
            to={`/list-your-show/events/${event.id}/edit`}
            className="text-xs px-3 py-1.5 bg-accent-crimson text-white rounded-lg"
          >
            View
          </Link>
        )}
        {event.status === 'published' && (
          <Link
            to={`/events/${event.slug}`}
            target="_blank"
            className="text-xs px-3 py-1.5 bg-accent-crimson text-white rounded-lg flex items-center gap-1 hover:opacity-90"
          >
            Live <ExternalLink size={10} />
          </Link>
        )}
      </div>
    </div>
  );
}

function EventRowSkeleton() {
  return (
    <div className="bg-bg-surface border border-border-default rounded-xl p-4 flex gap-4">
      <Skeleton width={64} height={96} className="rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton height={16} className="w-3/4" />
        <Skeleton height={12} className="w-1/3" />
        <Skeleton height={20} className="w-24 rounded-full" />
      </div>
    </div>
  );
}

export function LysMyEventsPage() {
  const navigate  = useNavigate();
  const { data: organizer } = useMyOrganizerProfile();
  const [tab, setTab] = useState('all');
  const [page]        = useState(1);
  const { data, isLoading } = useMyLysEvents(tab, page);

  if (!organizer) {
    return (
      <LysLayout>
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <p className="text-4xl mb-4">🎭</p>
          <h2 className="font-display font-bold text-xl text-text-primary mb-2">You're not an organizer yet</h2>
          <p className="text-text-muted text-sm mb-6">Create an organizer account to start listing your events.</p>
          <button
            onClick={() => navigate('/list-your-show/register')}
            className="px-6 py-2.5 bg-gradient-to-r from-accent-indigo to-[#7C3AED] text-white font-semibold rounded-full text-sm"
          >
            Register as Organizer
          </button>
        </div>
      </LysLayout>
    );
  }

  return (
    <LysLayout>
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display font-bold text-2xl text-text-primary">My Events</h1>
        <button
          onClick={() => navigate('/list-your-show/create')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-indigo to-[#7C3AED] text-white font-semibold rounded-full text-sm hover:opacity-90"
        >
          <PlusCircle size={14} />
          Create New Event
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex-shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors ${
              tab === t.value
                ? 'bg-accent-indigo text-white'
                : 'bg-bg-surface2 text-text-muted hover:text-text-primary border border-border-default'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Event list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => <EventRowSkeleton key={i} />)}
        </div>
      ) : !data?.items.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-3xl mb-3">🎭</p>
          <p className="text-text-secondary font-semibold mb-1">No events yet</p>
          <p className="text-text-muted text-sm">
            {tab === 'all'
              ? 'Create your first event to get started.'
              : `No events with status "${tab}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.items.map((ev) => <EventRow key={ev.id} event={ev} />)}
        </div>
      )}
    </div>
    </LysLayout>
  );
}
