import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Monitor, Users, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { PartnerLayout } from '../components/PartnerLayout';
import { PartnerScreenFormModal } from '../components/PartnerScreenFormModal';
import { SeatLayoutPreview } from '../components/SeatLayoutPreview';
import { usePartnerVenueDetail, useDeletePartnerScreen } from '../api/usePartner';
import { Modal } from '@/shared/components/ui/Modal';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import type { PartnerScreenInfo } from '../types';

// ── Delete confirmation ───────────────────────────────────────────────────────

interface DeleteScreenModalProps {
  screen: PartnerScreenInfo;
  venueId: string;
  onClose: () => void;
}

function DeleteScreenModal({ screen, venueId, onClose }: DeleteScreenModalProps) {
  const del = useDeletePartnerScreen(venueId);
  return (
    <Modal open onClose={onClose} maxWidth="max-w-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-semantic-error">
          <AlertTriangle size={20} />
          <h3 className="font-display font-bold text-lg">Delete Screen?</h3>
        </div>
        <p className="text-sm text-text-secondary">
          Delete <span className="font-semibold text-text-primary">{screen.name}</span>?
          This cannot be undone. Screens with scheduled shows cannot be deleted.
        </p>
        {del.isError && (
          <p className="text-xs text-semantic-error">
            Cannot delete — this screen may have scheduled shows.
          </p>
        )}
        <div className="flex flex-col gap-2">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-bg-surface2 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => del.mutate(screen.id, { onSuccess: onClose })}
            disabled={del.isPending}
            className="w-full px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
            style={{ background: '#E11D74' }}
          >
            {del.isPending ? 'Deleting…' : 'Delete Screen'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Screen card ───────────────────────────────────────────────────────────────

interface ScreenCardProps {
  screen: PartnerScreenInfo;
  onEdit: (screen: PartnerScreenInfo) => void;
  onDelete: (screen: PartnerScreenInfo) => void;
}

function ScreenCard({ screen, onEdit, onDelete }: ScreenCardProps) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-base p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Monitor size={16} className="text-accent-indigo flex-shrink-0" />
          <h3 className="font-semibold text-text-primary text-sm truncate">{screen.name}</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-text-secondary flex-shrink-0">
          <Users size={12} />
          <span>{screen.totalSeats} seats</span>
        </div>
      </div>

      <SeatLayoutPreview layout={screen.layout} totalSeats={screen.totalSeats} />

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onEdit(screen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-default text-text-secondary text-xs hover:text-accent-indigo hover:border-accent-indigo transition-colors"
        >
          <Pencil size={12} /> Edit
        </button>
        <button
          onClick={() => onDelete(screen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-default text-text-secondary text-xs hover:text-semantic-error hover:border-semantic-error/50 transition-colors"
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PartnerVenueDetailPage() {
  const { venueId } = useParams<{ venueId: string }>();
  const { data: venue, isLoading, isError, refetch } = usePartnerVenueDetail(venueId);

  const [addingScreen,     setAddingScreen]     = useState(false);
  const [editingScreen,    setEditingScreen]    = useState<PartnerScreenInfo | null>(null);
  const [deletingScreen,   setDeletingScreen]   = useState<PartnerScreenInfo | null>(null);

  return (
    <PartnerLayout>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div>
          <Link
            to="/partner/venues"
            className="flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm mb-4 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Venues
          </Link>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton height={80} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} height={220} />)}
            </div>
          </div>
        )}

        {isError && (
          <div className="rounded-md border border-semantic-error/30 bg-semantic-error/08 p-4 text-sm text-semantic-error flex items-center justify-between">
            <span>Failed to load venue details.</span>
            <button onClick={() => refetch()} className="underline hover:opacity-80">Retry</button>
          </div>
        )}

        {venue && (
          <>
            {/* Venue info card */}
            <div className="rounded-xl border border-border-default bg-bg-base p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-display font-bold text-text-primary">{venue.name}</h1>
                  {venue.chain && (
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-bg-surface2 text-text-muted mt-1">{venue.chain}</span>
                  )}
                  <p className="text-sm text-text-secondary mt-2">{venue.address}</p>
                  <p className="text-sm text-text-muted">{venue.cityName}</p>
                  <div className="flex items-center gap-3 mt-3 text-sm text-text-secondary">
                    {venue.contactPhone && <span>{venue.contactPhone}</span>}
                    {venue.contactEmail && <span>{venue.contactEmail}</span>}
                  </div>
                </div>
                <span className={`flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${venue.isActive ? 'bg-semantic-success/15 text-semantic-success' : 'bg-bg-surface3 text-text-muted'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${venue.isActive ? 'bg-semantic-success' : 'bg-text-muted'}`} />
                  {venue.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {venue.amenities && (
                <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border-default">
                  {(() => {
                    let items: string[] = [];
                    try { items = JSON.parse(venue.amenities) as string[]; }
                    catch { items = venue.amenities.split(',').map((s) => s.trim()).filter(Boolean); }
                    return items.map((a) => (
                      <span key={a} className="text-[11px] px-2 py-0.5 rounded-full bg-bg-surface2 text-text-secondary">{a}</span>
                    ));
                  })()}
                </div>
              )}
            </div>

            {/* Screens section */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="text-lg font-display font-bold text-text-primary">
                  Screens ({venue.screens.length})
                </h2>
                <button
                  onClick={() => setAddingScreen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent-crimson text-white text-sm font-semibold hover:opacity-90 transition-opacity border-2 border-white/30"
                >
                  <Plus size={14} /> Add Screen
                </button>
              </div>

              {venue.screens.length === 0 ? (
                <div className="rounded-lg border border-border-default bg-bg-base p-8 text-center text-sm text-text-muted">
                  No screens configured for this venue yet. Click "Add Screen" to create one.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {venue.screens.map((screen) => (
                    <ScreenCard
                      key={screen.id}
                      screen={screen}
                      onEdit={setEditingScreen}
                      onDelete={setDeletingScreen}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add screen modal */}
      {addingScreen && venueId && (
        <PartnerScreenFormModal
          venueId={venueId}
          onClose={() => setAddingScreen(false)}
        />
      )}

      {/* Edit screen modal */}
      {editingScreen && venueId && (
        <PartnerScreenFormModal
          venueId={venueId}
          screen={editingScreen}
          onClose={() => setEditingScreen(null)}
        />
      )}

      {/* Delete screen modal */}
      {deletingScreen && venueId && (
        <DeleteScreenModal
          screen={deletingScreen}
          venueId={venueId}
          onClose={() => setDeletingScreen(null)}
        />
      )}
    </PartnerLayout>
  );
}
