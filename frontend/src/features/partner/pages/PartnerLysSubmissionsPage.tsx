import { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp, ExternalLink, AlertTriangle } from 'lucide-react';
import { PartnerLayout } from '../components/PartnerLayout';
import {
  usePartnerLysSubmissions,
  useApprovePartnerLys,
  useRejectPartnerLys,
  useRequestChangesPartnerLys,
} from '../api/usePartnerLys';
import type { LysPartnerEvent } from '../types';
import { Skeleton } from '@/shared/components/ui/Skeleton';

const STATUS_TABS = [
  { label: 'Pending My Review', value: 'pending' },
  { label: 'Approved by Me',    value: 'approved' },
  { label: 'Rejected by Me',    value: 'rejected' },
  { label: 'All',               value: 'all' },
] as const;

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export default function PartnerLysSubmissionsPage() {
  const [status, setStatus]     = useState<string>('submitted');
  const [page, setPage]         = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [changesId, setChangesId] = useState<string | null>(null);
  const [changesNotes, setChangesNotes] = useState('');

  const { data, isLoading, isError, refetch } = usePartnerLysSubmissions({ status, page, pageSize: 15 });
  const approve        = useApprovePartnerLys();
  const reject         = useRejectPartnerLys();
  const requestChanges = useRequestChangesPartnerLys();

  function handleStatusChange(s: string) {
    setStatus(s);
    setPage(1);
    setExpanded(null);
  }

  async function handleApprove(eventId: string) {
    await approve.mutateAsync(eventId);
  }

  async function handleReject() {
    if (!rejectId || !rejectReason.trim()) return;
    await reject.mutateAsync({ eventId: rejectId, reason: rejectReason.trim() });
    setRejectId(null);
    setRejectReason('');
  }

  async function handleRequestChanges() {
    if (!changesId || !changesNotes.trim()) return;
    await requestChanges.mutateAsync({ eventId: changesId, notes: changesNotes.trim() });
    setChangesId(null);
    setChangesNotes('');
  }

  return (
    <PartnerLayout>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-display font-bold text-text-primary">Event Submissions</h1>
          <p className="text-sm text-text-secondary mt-1">
            Review and approve event submissions from organizers at your venue.
          </p>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-px border-b border-border-default scrollbar-none">
          {STATUS_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => handleStatusChange(t.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                status === t.value
                  ? 'border-accent-indigo text-accent-indigo'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height={64} />)}
          </div>
        )}

        {isError && (
          <div className="rounded-md border border-semantic-error/30 bg-semantic-error/08 p-4 text-sm text-semantic-error flex items-center justify-between">
            <span>Failed to load submissions.</span>
            <button onClick={() => refetch()} className="underline hover:opacity-80">Retry</button>
          </div>
        )}

        {data && data.items.length === 0 && (
          <div className="text-center py-16 text-text-muted">
            No submissions found for this filter.
          </div>
        )}

        {data && data.items.length > 0 && (
          <div className="space-y-3">
            {data.items.map(ev => (
              <EventCard
                key={ev.id}
                ev={ev}
                isExpanded={expanded === ev.id}
                onToggle={() => setExpanded(expanded === ev.id ? null : ev.id)}
                onApprove={() => handleApprove(ev.id)}
                onReject={() => { setRejectId(ev.id); setRejectReason(''); }}
                onRequestChanges={() => { setChangesId(ev.id); setChangesNotes(''); }}
                approving={approve.isPending}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">
              Page {data.page} of {data.totalPages} — {data.total} total
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded border border-border-default text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded border border-border-default text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-bg-base border border-border-default rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-display font-bold text-text-primary">Reject Submission</h2>
            <p className="text-sm text-text-secondary">
              Please provide a reason for rejecting this event. The organizer will receive this feedback.
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection…"
              rows={4}
              className="w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-indigo/50 resize-none"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRejectId(null)}
                className="px-4 py-2 text-sm rounded-md border border-border-default text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || reject.isPending}
                className="px-4 py-2 text-sm rounded-md bg-semantic-error text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reject.isPending ? 'Rejecting…' : 'Reject Event'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Changes modal */}
      {changesId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-bg-base border border-border-default rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-display font-bold text-text-primary">Request Changes</h2>
            <p className="text-sm text-text-secondary">
              Describe what needs to be updated. The organizer will be notified and must resubmit before you can approve.
            </p>
            <textarea
              value={changesNotes}
              onChange={e => setChangesNotes(e.target.value)}
              placeholder="e.g. Please update the event description and confirm the exact venue address…"
              rows={4}
              className="w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-indigo/50 resize-none"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setChangesId(null)}
                className="px-4 py-2 text-sm rounded-md border border-border-default text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={!changesNotes.trim() || requestChanges.isPending}
                className="px-4 py-2 text-sm rounded-md bg-amber-500 text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestChanges.isPending ? 'Sending…' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PartnerLayout>
  );
}

interface EventCardProps {
  ev: LysPartnerEvent;
  isExpanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRequestChanges: () => void;
  approving: boolean;
}

function EventCard({ ev, isExpanded, onToggle, onApprove, onReject, onRequestChanges, approving }: EventCardProps) {
  const isPending  = ev.partnerAction === null && ev.status === 'submitted';
  const isApproved = ev.partnerAction === 'approved';
  const isRejected = ev.partnerAction === 'rejected';

  return (
    <div className="rounded-lg border border-border-default bg-bg-base overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-3">
        {ev.posterUrl && (
          <img src={ev.posterUrl} alt={ev.title} className="w-10 h-14 object-cover rounded flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-text-primary truncate">{ev.title}</span>
            <span className="text-xs text-text-muted px-1.5 py-0.5 rounded bg-bg-surface2 capitalize">{ev.type.replace('_', ' ')}</span>
            {isPending  && <span className="text-xs px-2 py-0.5 rounded-full bg-accent-indigo/15 text-accent-indigo font-medium">Pending Review</span>}
            {isApproved && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium">Approved</span>}
            {isRejected && <span className="text-xs px-2 py-0.5 rounded-full bg-semantic-error/15 text-semantic-error font-medium">Rejected</span>}
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            {ev.organizerName} · {ev.eventDateLabel} at {ev.eventTimeLabel} · {ev.venueDisplay}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isPending && (
            <>
              <button
                onClick={onApprove}
                disabled={approving}
                aria-label="Approve"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-green-600 text-white font-medium hover:bg-green-500 disabled:opacity-50 transition-colors"
              >
                <Check size={13} />
                Approve
              </button>
              <button
                onClick={onRequestChanges}
                aria-label="Request changes"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400 font-medium hover:bg-amber-500/30 transition-colors"
              >
                <AlertTriangle size={13} />
                Changes
              </button>
              <button
                onClick={onReject}
                aria-label="Reject"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-semantic-error text-white font-medium hover:opacity-90 transition-colors"
              >
                <X size={13} />
                Reject
              </button>
            </>
          )}
          <button
            onClick={onToggle}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-bg-surface2 transition-colors"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border-default px-4 py-4 space-y-4 bg-bg-surface">
          {/* Rejection note */}
          {isRejected && ev.partnerReviewNotes && (
            <div className="rounded-md border border-semantic-error/30 bg-semantic-error/08 px-3 py-2 text-sm text-semantic-error">
              <strong>Rejection reason:</strong> {ev.partnerReviewNotes}
            </div>
          )}

          {/* Two-column details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <Detail label="Organizer" value={`${ev.organizerName} (${ev.organizerEmail})`} />
            <Detail label="Language" value={ev.language} />
            <Detail label="Age Restriction" value={ev.ageRestriction === 0 ? 'All ages' : `${ev.ageRestriction}+`} />
            {ev.durationMin && <Detail label="Duration" value={`${ev.durationMin} min`} />}
            <Detail label="Submitted" value={ev.submittedAt ? new Date(ev.submittedAt).toLocaleDateString('en-IN') : '—'} />
          </div>

          {/* Price tiers */}
          {ev.priceTiers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Price Tiers</p>
              <div className="flex flex-wrap gap-2">
                {ev.priceTiers.map((t, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full border"
                    style={{ borderColor: t.color ?? '#6366F1', color: t.color ?? '#6366F1' }}
                  >
                    {t.name} — {formatINR(t.price)} ({t.capacity} seats)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Artists */}
          {ev.artists.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Artists</p>
              <div className="flex flex-wrap gap-2">
                {ev.artists.map((a, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-bg-surface2 text-text-secondary">
                    {a.name} <span className="text-text-muted">({a.type})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {ev.description && (
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-text-secondary leading-relaxed">{ev.description}</p>
            </div>
          )}

          {/* Backdrop / view on site */}
          <div className="flex items-center gap-3">
            {ev.backdropUrl && (
              <img src={ev.backdropUrl} alt="backdrop" className="h-20 rounded object-cover" />
            )}
            {ev.status === 'published' && (
              <a
                href={`/events/${ev.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-accent-indigo hover:underline"
              >
                <ExternalLink size={12} />
                View live event
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-text-muted">{label}: </span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}
