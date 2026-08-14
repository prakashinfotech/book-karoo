import { useState } from 'react';
import { Eye, CheckCircle, XCircle, AlertTriangle, Search, X, ShieldCheck, EyeOff } from 'lucide-react';
import { AdminLayout } from '@/shared/components/layout/AdminLayout';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { getPosterUrl } from '@/shared/lib/imageUtils';
import { LYS_STATUS_CONFIG } from '@/features/lys/types';
import type { AdminLysEvent, LysEventStatus } from '@/features/lys/types';
import {
  useAdminLysSubmissions,
  useAdminLysSubmissionDetail,
  useApproveSubmission,
  useRejectSubmission,
  useRequestChanges,
  useUnpublishSubmission,
} from '@/features/lys/api/useLys';

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All',            value: 'all' },
  { label: 'Submitted',      value: 'submitted' },
  { label: 'Changes Needed', value: 'changes_requested' },
  { label: 'Live',           value: 'published' },
  { label: 'Rejected',       value: 'rejected' },
];

const TYPE_LABELS: Record<string, string> = {
  live_event: 'Live Event', play: 'Play', comedy: 'Comedy',
  sport: 'Sport', activity: 'Activity', other: 'Other',
};

// ── Detail modal ──────────────────────────────────────────────────────────────

interface DetailModalProps {
  eventId: string;
  onClose: () => void;
}

function TextareaModal({
  title, placeholder, actionLabel, onConfirm, onClose, isPending,
}: {
  title: string;
  placeholder: string;
  actionLabel: string;
  onConfirm: (text: string) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [text, setText] = useState('');
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-bg-surface border border-border-default rounded-2xl p-6 w-full max-w-md">
        <h3 className="font-display font-bold text-text-primary text-lg mb-4">{title}</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full px-4 py-3 bg-bg-surface2 border border-border-default rounded-lg text-text-primary text-sm resize-none focus:outline-none focus:border-accent-indigo"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-border-default rounded-lg text-text-secondary text-sm hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(text)}
            disabled={!text.trim() || isPending}
            className="flex-1 py-2.5 bg-accent-indigo text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Saving…' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubmissionDetailModal({ eventId, onClose }: DetailModalProps) {
  const { data: ev, isLoading } = useAdminLysSubmissionDetail(eventId);
  const approve   = useApproveSubmission();
  const reject    = useRejectSubmission();
  const changes   = useRequestChanges();
  const unpublish = useUnpublishSubmission();

  const [actionModal, setActionModal] = useState<'reject' | 'changes' | 'unpublish' | null>(null);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-bg-surface border border-border-default rounded-2xl p-6 w-full max-w-2xl space-y-3">
          <Skeleton height={24} className="w-1/2" />
          <Skeleton height={200} />
          <Skeleton height={40} />
        </div>
      </div>
    );
  }
  if (!ev) return null;

  const cfg = LYS_STATUS_CONFIG[ev.status as LysEventStatus];
  const canAct = ev.status !== 'published' && ev.status !== 'completed';

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-bg-surface border border-border-default rounded-2xl w-full max-w-2xl my-4">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-border-default">
            <div>
              <h2 className="font-display font-bold text-text-primary text-lg">{ev.title}</h2>
              <p className="text-text-muted text-xs mt-1">
                {TYPE_LABELS[ev.type] ?? ev.type} · {ev.eventDateLabel} {ev.eventTimeLabel}
              </p>
            </div>
            <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
            {/* Status */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-accent-crimson text-white">
                {cfg.label}
              </span>
              {!ev.isOrganizerVerified && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full">
                  <AlertTriangle size={11} />
                  Organizer not verified
                </span>
              )}
              {ev.submittedAt && (
                <span className="text-xs text-text-muted">
                  Submitted {new Date(ev.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>

            {/* Media */}
            {(ev.posterUrl || ev.backdropUrl) && (
              <div className="flex gap-4 items-start">
                {ev.posterUrl && (
                  <div>
                    <p className="text-text-muted text-xs mb-1">Poster</p>
                    <img src={getPosterUrl(ev.posterUrl, 'w185')} alt={ev.title} className="w-24 rounded-lg" />
                  </div>
                )}
                {ev.backdropUrl && (
                  <div className="flex-1">
                    <p className="text-text-muted text-xs mb-1">Banner</p>
                    <img src={ev.backdropUrl} alt="Backdrop" className="w-full h-20 object-cover rounded-lg" />
                  </div>
                )}
              </div>
            )}

            {/* Event Details */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Event Details</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-text-muted text-xs mb-0.5">Type</p>
                  <p className="text-text-primary">{TYPE_LABELS[ev.type] ?? ev.type}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs mb-0.5">Date & Time</p>
                  <p className="text-text-primary">{ev.eventDateLabel}, {ev.eventTimeLabel}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs mb-0.5">Language</p>
                  <p className="text-text-primary">{ev.language || '—'}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs mb-0.5">Age Restriction</p>
                  <p className="text-text-primary">{ev.ageRestriction === 0 ? 'All Ages' : `${ev.ageRestriction}+`}</p>
                </div>
                {ev.durationMin && (
                  <div>
                    <p className="text-text-muted text-xs mb-0.5">Duration</p>
                    <p className="text-text-primary">{ev.durationMin} min</p>
                  </div>
                )}
              </div>
              {ev.description && (
                <div>
                  <p className="text-text-muted text-xs mb-1">Description</p>
                  <p className="text-text-secondary text-xs leading-relaxed bg-bg-surface2 rounded-lg p-3 max-h-28 overflow-y-auto">
                    {ev.description}
                  </p>
                </div>
              )}
            </div>

            {/* Organizer */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Organizer</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-text-muted text-xs mb-0.5">Name</p>
                  <p className="text-text-primary">{ev.organizerName}</p>
                  <p className="text-text-muted text-xs">{ev.organizerEmail}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs mb-0.5">PAN</p>
                  <p className="text-text-primary font-mono">{ev.organizerPan}</p>
                </div>
              </div>
            </div>

            {/* Partner approval */}
            {ev.requiresPartnerApproval && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Venue Partner Review</p>
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  ev.partnerAction === 'approved'
                    ? 'bg-green-500/10 border border-green-500/25 text-green-400'
                    : ev.partnerAction === 'rejected'
                    ? 'bg-semantic-error/10 border border-semantic-error/25 text-semantic-error'
                    : 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                }`}>
                  <ShieldCheck size={14} className="flex-shrink-0" />
                  {ev.partnerAction === 'approved' && <span><strong>{ev.assignedPartnerName}</strong> approved this event</span>}
                  {ev.partnerAction === 'rejected' && <span><strong>{ev.assignedPartnerName}</strong> rejected this event</span>}
                  {!ev.partnerAction && <span>Awaiting review from <strong>{ev.assignedPartnerName ?? 'venue partner'}</strong></span>}
                </div>
                {ev.partnerReviewNotes && (
                  <p className="text-text-secondary text-xs bg-bg-surface2 rounded-lg p-2">{ev.partnerReviewNotes}</p>
                )}
              </div>
            )}

            {/* Venue */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Venue</p>
              <div className="text-sm">
                <p className="text-text-primary">{ev.venueDisplay || '—'}</p>
                {ev.venueType === 'custom' && ev.customVenueAddress && (
                  <p className="text-text-muted text-xs mt-0.5">{ev.customVenueAddress}</p>
                )}
              </div>
            </div>

            {/* Artists */}
            {ev.artists.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Artists / Performers</p>
                <div className="space-y-2">
                  {ev.artists.map((a, i) => (
                    <div key={i} className="bg-bg-surface2 rounded-lg px-3 py-2 text-sm">
                      <span className="text-text-primary font-semibold">{a.name}</span>
                      <span className="text-text-muted text-xs ml-2">{a.type}</span>
                      {a.bio && <p className="text-text-muted text-xs mt-0.5">{a.bio}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ticket Tiers */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Ticket Tiers</p>
              {ev.priceTiers.length === 0 ? (
                <p className="text-text-muted text-xs">No tiers defined</p>
              ) : (
                <div className="space-y-1.5">
                  {ev.priceTiers.map((t, i) => (
                    <div key={i} className="flex items-center gap-3 bg-bg-surface2 rounded-lg px-3 py-2 text-sm">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="text-text-primary flex-1">{t.name}</span>
                      <span className="text-text-secondary">₹{t.price.toLocaleString('en-IN')}</span>
                      <span className="text-text-muted text-xs">{t.capacity} seats</span>
                    </div>
                  ))}
                  <p className="text-text-muted text-xs pt-1">
                    Commission: {ev.commissionRate}% per ticket
                  </p>
                </div>
              )}
            </div>

            {/* Review notes */}
            {ev.reviewNotes && (
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Review Notes</p>
                <p className="text-text-secondary text-sm bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">{ev.reviewNotes}</p>
              </div>
            )}

            {/* Actions */}
            {canAct && (
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={async () => {
                    await approve.mutateAsync(ev.id);
                    onClose();
                  }}
                  disabled={approve.isPending || !ev.isOrganizerVerified}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-500/15 border border-green-500/30 rounded-lg text-green-400 text-sm font-semibold hover:opacity-90 disabled:opacity-40"
                  title={!ev.isOrganizerVerified ? 'Verify the organizer first' : undefined}
                >
                  <CheckCircle size={14} />
                  {approve.isPending ? 'Publishing…' : 'Approve & Publish'}
                </button>
                <button
                  onClick={() => setActionModal('changes')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/15 border border-amber-500/30 rounded-lg text-amber-400 text-sm font-semibold hover:opacity-90"
                >
                  <AlertTriangle size={14} />
                  Request Changes
                </button>
                <button
                  onClick={() => setActionModal('reject')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-semantic-error/10 border border-semantic-error/30 rounded-lg text-semantic-error text-sm font-semibold hover:opacity-90"
                >
                  <XCircle size={14} />
                  Reject
                </button>
              </div>
            )}
            {ev.status === 'published' && (
              <div className="flex pt-2 border-t border-border-default">
                <button
                  onClick={() => setActionModal('unpublish')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-bg-surface2 border border-border-default rounded-lg text-text-secondary text-sm font-semibold hover:text-semantic-error hover:border-semantic-error/40 transition-colors"
                >
                  <EyeOff size={14} />
                  Unpublish Event
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {actionModal === 'reject' && (
        <TextareaModal
          title="Reject Event"
          placeholder="Explain why this event is being rejected (visible to organizer)…"
          actionLabel="Reject"
          isPending={reject.isPending}
          onClose={() => setActionModal(null)}
          onConfirm={async (reason) => {
            await reject.mutateAsync({ id: ev.id, reason });
            setActionModal(null);
            onClose();
          }}
        />
      )}
      {actionModal === 'changes' && (
        <TextareaModal
          title="Request Changes"
          placeholder="Describe the changes needed (visible to organizer)…"
          actionLabel="Send Request"
          isPending={changes.isPending}
          onClose={() => setActionModal(null)}
          onConfirm={async (notes) => {
            await changes.mutateAsync({ id: ev.id, notes });
            setActionModal(null);
            onClose();
          }}
        />
      )}
      {actionModal === 'unpublish' && (
        <TextareaModal
          title="Unpublish Event"
          placeholder="Reason for unpublishing (internal note, not shown to organizer)…"
          actionLabel="Unpublish"
          isPending={unpublish.isPending}
          onClose={() => setActionModal(null)}
          onConfirm={async (reason) => {
            await unpublish.mutateAsync({ id: ev.id, reason });
            setActionModal(null);
            onClose();
          }}
        />
      )}
    </>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function SubmissionRow({ event, onSelect }: { event: AdminLysEvent; onSelect: () => void }) {
  const cfg = LYS_STATUS_CONFIG[event.status as LysEventStatus];
  return (
    <tr className="border-b border-border-default hover:bg-bg-surface2 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {event.posterUrl ? (
            <img
              src={getPosterUrl(event.posterUrl, 'w92')}
              alt={event.title}
              className="w-10 h-14 object-cover rounded"
            />
          ) : (
            <div className="w-10 h-14 rounded bg-bg-surface2 flex items-center justify-center text-lg">🎭</div>
          )}
          <div>
            <p className="text-text-primary text-sm font-semibold line-clamp-1 max-w-[200px]">{event.title}</p>
            <p className="text-text-muted text-xs">{TYPE_LABELS[event.type] ?? event.type}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary">{event.organizerName}</td>
      <td className="px-4 py-3 text-sm text-text-muted">{event.eventDateLabel}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent-crimson text-white">
            {cfg.label}
          </span>
          {event.requiresPartnerApproval && (
            <span
              title={event.partnerAction === 'approved' ? `Partner approved` : event.partnerAction === 'rejected' ? 'Partner rejected' : 'Awaiting partner review'}
              className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                event.partnerAction === 'approved'
                  ? 'bg-green-500/15 text-green-400'
                  : event.partnerAction === 'rejected'
                  ? 'bg-semantic-error/15 text-semantic-error'
                  : 'bg-amber-500/15 text-amber-400'
              }`}
            >
              <ShieldCheck size={9} />
              {event.partnerAction === 'approved' ? 'Partner ✓' : event.partnerAction === 'rejected' ? 'Partner ✗' : 'Awaiting partner'}
            </span>
          )}
          {!event.isOrganizerVerified && (
            <span title="Organizer not verified"><AlertTriangle size={12} className="text-amber-400" /></span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-text-muted">
        {event.submittedAt
          ? new Date(event.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
          : '—'}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={onSelect}
          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-accent-crimson text-white rounded-lg hover:opacity-90"
        >
          <Eye size={11} /> View
        </button>
      </td>
    </tr>
  );
}

function TableSkeleton() {
  return (
    <>{Array.from({ length: 5 }, (_, i) => (
      <tr key={i} className="border-b border-border-default">
        <td className="px-4 py-3"><Skeleton height={56} className="w-full rounded" /></td>
        <td className="px-4 py-3"><Skeleton height={14} className="w-24" /></td>
        <td className="px-4 py-3"><Skeleton height={14} className="w-20" /></td>
        <td className="px-4 py-3"><Skeleton height={20} className="w-20 rounded-full" /></td>
        <td className="px-4 py-3"><Skeleton height={14} className="w-16" /></td>
        <td className="px-4 py-3"><Skeleton height={28} className="w-16 rounded-lg" /></td>
      </tr>
    ))}</>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function AdminLysSubmissionsPage() {
  const [statusTab, setStatusTab]       = useState('all');
  const [page, setPage]                 = useState(1);
  const [search, setSearch]             = useState('');
  const [selectedId, setSelectedId]     = useState<string | null>(null);

  const filters = { status: statusTab === 'all' ? undefined : statusTab, search: search || undefined };
  const { data, isLoading } = useAdminLysSubmissions(filters, page);

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl text-text-primary">LYS Submissions</h1>
            <p className="text-text-muted text-sm mt-1">Review and approve organizer event submissions.</p>
          </div>
          {data && (
            <p className="text-text-muted text-sm">{data.total} total</p>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          {/* Status tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => { setStatusTab(t.value); setPage(1); }}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  statusTab === t.value
                    ? 'bg-accent-indigo text-white'
                    : 'bg-bg-surface2 text-text-muted border border-border-default hover:text-text-primary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by title or organizer…"
              className="w-full pl-9 pr-8 py-2 bg-bg-surface2 border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent-indigo"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-bg-surface border border-border-default rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default bg-bg-surface2">
                <th className="px-4 py-3 text-left text-xs text-text-muted font-semibold">Event</th>
                <th className="px-4 py-3 text-left text-xs text-text-muted font-semibold">Organizer</th>
                <th className="px-4 py-3 text-left text-xs text-text-muted font-semibold">Date</th>
                <th className="px-4 py-3 text-left text-xs text-text-muted font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-xs text-text-muted font-semibold">Submitted</th>
                <th className="px-4 py-3 text-left text-xs text-text-muted font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton />
              ) : !data?.items.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <p className="text-3xl mb-3">📋</p>
                    <p className="text-text-secondary font-semibold">No submissions</p>
                    <p className="text-text-muted text-sm mt-1">
                      {statusTab === 'all' ? 'No events have been submitted yet.' : `No events with status "${statusTab}".`}
                    </p>
                  </td>
                </tr>
              ) : (
                data.items.map((ev) => (
                  <SubmissionRow key={ev.id} event={ev} onSelect={() => setSelectedId(ev.id)} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-text-muted">
            <span>Page {page} of {data.totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 border border-border-default rounded-lg disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page === data.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 border border-border-default rounded-lg disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedId && (
        <SubmissionDetailModal eventId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </AdminLayout>
  );
}
