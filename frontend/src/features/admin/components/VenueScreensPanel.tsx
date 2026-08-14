import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useAdminVenueDetail, useDeleteScreen } from '../api/useAdmin';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { ScreenFormModal } from './ScreenFormModal';
import type { ScreenDetail } from '../types';

interface Props {
  venueId:   string;
  venueName: string;
}

export function VenueScreensPanel({ venueId, venueName }: Props) {
  const { data: venue, isLoading } = useAdminVenueDetail(venueId);
  const deleteScreen = useDeleteScreen();

  const [addModal, setAddModal]       = useState(false);
  const [editScreen, setEditScreen]   = useState<ScreenDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScreenDetail | null>(null);

  const screens = venue?.screens ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-base text-text-primary">
          Screens ({isLoading ? '…' : screens.length})
        </h3>
        <button
          onClick={() => setAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-crimson text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={14} /> Add Screen
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-xl border border-border-default p-4 space-y-2">
              <Skeleton height={16} width="60%" />
              <Skeleton height={12} width="40%" />
              <Skeleton height={12} width="80%" />
            </div>
          ))}
        </div>
      ) : screens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <p className="text-text-muted font-sans text-sm">No screens added yet.</p>
          <button
            onClick={() => setAddModal(true)}
            className="px-4 py-2 rounded-lg bg-accent-crimson text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Add Screen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {screens.map((screen) => (
            <ScreenCard
              key={screen.id}
              screen={screen}
              onEdit={() => setEditScreen(screen)}
              onDelete={() => setDeleteTarget(screen)}
            />
          ))}
        </div>
      )}

      {addModal && (
        <ScreenFormModal
          mode="create"
          venueId={venueId}
          venueName={venueName}
          onClose={() => setAddModal(false)}
          onSuccess={() => setAddModal(false)}
        />
      )}

      {editScreen && (
        <ScreenFormModal
          mode="edit"
          venueId={venueId}
          venueName={venueName}
          screen={editScreen}
          onClose={() => setEditScreen(null)}
          onSuccess={() => setEditScreen(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          itemName={deleteTarget.name}
          isLoading={deleteScreen.isPending}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() =>
            deleteScreen.mutate(
              { screenId: deleteTarget.id, venueId },
              { onSuccess: () => setDeleteTarget(null) }
            )
          }
        />
      )}
    </div>
  );
}

interface ScreenCardProps {
  screen:   ScreenDetail;
  onEdit:   () => void;
  onDelete: () => void;
}

function ScreenCard({ screen, onEdit, onDelete }: ScreenCardProps) {
  const layout = screen.layout;

  return (
    <div className="rounded-xl border border-border-default bg-bg-surface p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text-primary text-[15px]">{screen.name}</span>
          {!screen.isActive && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-bg-surface3 text-text-muted font-semibold uppercase tracking-wider">Inactive</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="text-text-muted hover:text-accent-indigo transition-colors" aria-label="Edit screen">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="text-text-muted hover:text-semantic-error transition-colors" aria-label="Delete screen">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <p className="text-[13px] text-text-muted mb-2">{screen.totalSeats} seats total</p>

      {layout && (
        <>
          {layout.categories && layout.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {layout.categories.map((cat) => (
                <span key={cat.name} className="flex items-center gap-1 text-[12px] text-text-secondary">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                  <span className="text-text-muted text-[11px]">({cat.rows.join(',')}) ₹{cat.price}</span>
                </span>
              ))}
            </div>
          )}

          {(layout.aisleAfterCols?.length ?? 0) > 0 && (
            <p className="text-[11px] text-text-muted mt-1.5">
              Aisle after col: {layout.aisleAfterCols.join(', ')}
            </p>
          )}

          {(layout.blockedSeats?.length ?? 0) > 0 && (
            <p className="text-[11px] text-text-muted mt-0.5">
              {layout.blockedSeats.length} blocked seat(s)
            </p>
          )}
        </>
      )}
    </div>
  );
}
