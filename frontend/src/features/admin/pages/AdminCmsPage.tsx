import { useState } from 'react';
import { AdminLayout } from '@/shared/components/layout/AdminLayout';
import { BannerFormModal } from '../components/BannerFormModal';
import {
  useAdminBanners, useDeleteBanner,
  useReorderBanners, useToggleBanner,
} from '../api/useAdmin';
import type { AdminBanner } from '../types';

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

interface DeleteModalProps {
  banner:    AdminBanner;
  onConfirm: () => void;
  onClose:   () => void;
  loading:   boolean;
}

function DeleteConfirmModal({ banner, onConfirm, onClose, loading }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-bg-surface rounded-2xl border border-border-default shadow-2xl p-6">
        <h2 className="font-display font-bold text-lg mb-2 text-text-primary">Delete Banner?</h2>
        <p className="text-sm text-text-secondary font-sans mb-1">
          <span className="font-semibold">"{banner.title}"</span> will be removed from the home page.
        </p>
        <p className="text-xs text-text-muted font-sans mb-5">This action cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 rounded-full border border-border-default text-sm font-semibold font-sans hover:bg-bg-surface2 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="px-4 py-2 rounded-full bg-semantic-error text-white text-sm font-semibold font-sans hover:-translate-y-0.5 transition-all disabled:opacity-50">
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange, loading }: { checked: boolean; onChange: () => void; loading: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={loading}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
        checked ? 'bg-semantic-success' : 'bg-bg-surface3'
      }`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-4' : 'translate-x-0.5'
      }`} />
    </button>
  );
}

// ── Banner Card ───────────────────────────────────────────────────────────────

interface BannerCardProps {
  banner:   AdminBanner;
  index:    number;
  total:    number;
  onEdit:   (b: AdminBanner) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string, index: number) => void;
  onMoveDn: (id: string, index: number) => void;
}

function BannerCard({ banner, index, total, onEdit, onDelete, onMoveUp, onMoveDn }: BannerCardProps) {
  const toggle        = useToggleBanner();
  const isToggling    = toggle.isPending;

  const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-bg-surface border border-border-default hover:border-accent-indigo/30 transition-colors">
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-[120px] h-[68px] rounded-lg overflow-hidden bg-bg-surface2 border border-border-default">
        {banner.imageUrl ? (
          <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-2xl">🖼</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 px-2">
        <div className="font-semibold text-text-primary text-sm truncate">{banner.title}</div>
        {banner.imageUrl && (
          <div className="text-xs text-text-muted font-sans truncate max-w-xs mt-0.5">{banner.imageUrl}</div>
        )}
        {banner.linkUrl && (
          <div className="text-xs text-text-muted font-sans truncate max-w-xs">{banner.linkUrl}</div>
        )}
        {(banner.startsAt || banner.endsAt) && (
          <div className="text-xs text-text-muted font-sans mt-0.5">
            📅 {fmtDate(banner.startsAt)} → {fmtDate(banner.endsAt)}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex-shrink-0 flex flex-col items-end gap-2">
        <span className="font-mono text-xs text-text-muted px-2 py-0.5 rounded-full bg-bg-surface2 border border-border-default">
          #{banner.position + 1}
        </span>

        <ToggleSwitch
          checked={banner.isActive}
          loading={isToggling}
          onChange={() => toggle.mutate({ id: banner.id, isActive: !banner.isActive })}
        />

        <div className="flex items-center gap-1">
          <button
            onClick={() => onMoveUp(banner.id, index)}
            disabled={index === 0}
            className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-bg-surface2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            title="Move up"
          >▲</button>
          <button
            onClick={() => onMoveDn(banner.id, index)}
            disabled={index === total - 1}
            className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-bg-surface2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            title="Move down"
          >▼</button>
          <button
            onClick={() => onEdit(banner)}
            className="w-6 h-6 flex items-center justify-center rounded text-accent-indigo hover:bg-accent-indigo/10 transition-colors text-sm"
            title="Edit"
          >✏️</button>
          <button
            onClick={() => onDelete(banner.id)}
            className="w-6 h-6 flex items-center justify-center rounded text-semantic-error hover:bg-semantic-error/10 transition-colors text-sm"
            title="Delete"
          >🗑️</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminCmsPage() {
  const { data: banners = [], isLoading, isError } = useAdminBanners();
  const deleteBanner   = useDeleteBanner();
  const reorderBanners = useReorderBanners();

  const [showCreate,  setShowCreate]  = useState(false);
  const [editing,     setEditing]     = useState<AdminBanner | null>(null);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);

  const activeBanners = banners.filter((b) => b.isActive);

  const handleMoveUp = (_id: string, index: number) => {
    if (index === 0) return;
    const ordered = [...banners.map((b) => b.id)];
    [ordered[index - 1], ordered[index]] = [ordered[index], ordered[index - 1]];
    reorderBanners.mutate(ordered);
  };

  const handleMoveDn = (_id: string, index: number) => {
    if (index === banners.length - 1) return;
    const ordered = [...banners.map((b) => b.id)];
    [ordered[index], ordered[index + 1]] = [ordered[index + 1], ordered[index]];
    reorderBanners.mutate(ordered);
  };

  const deletingBanner = banners.find((b) => b.id === deletingId);

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl tracking-tight">CMS — Home Banners</h1>
            <p className="text-text-muted text-sm font-sans mt-1">Manage homepage promotional banners.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-full bg-accent-crimson text-white text-sm font-semibold font-sans hover:-translate-y-0.5 transition-all"
          >
            + Add Banner
          </button>
        </div>

        {/* Active Preview Strip */}
        {activeBanners.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-text-muted font-sans uppercase tracking-wider mb-2">
              Current Active Banners
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {activeBanners.map((b) => (
                <div key={b.id} className="flex-shrink-0 w-40">
                  <div className="w-40 h-[90px] rounded-lg overflow-hidden bg-bg-surface2 border border-border-default">
                    {b.imageUrl
                      ? <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                      : <div className="flex items-center justify-center h-full text-2xl">🖼</div>
                    }
                  </div>
                  <div className="mt-1 text-xs text-text-secondary font-sans truncate">{b.title}</div>
                  <div className="mt-0.5 inline-flex px-1.5 py-0.5 rounded-full bg-semantic-success/15 text-semantic-success text-[10px] font-semibold">
                    Active
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Banner List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-primary font-sans">All Banners ({banners.length})</h2>
            <p className="text-xs text-text-muted font-sans">💡 Use ▲ ▼ arrows to reorder banners</p>
          </div>

          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-bg-surface2 animate-pulse" />
              ))}
            </div>
          )}

          {isError && (
            <div className="flex items-center justify-center h-40 text-semantic-error text-sm font-sans">
              Failed to load banners. Please try again.
            </div>
          )}

          {!isLoading && !isError && banners.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <span className="text-4xl">🖼</span>
              <p className="text-text-secondary font-sans text-sm">No banners yet</p>
              <p className="text-text-muted font-sans text-xs">Add your first home page banner</p>
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 rounded-full bg-accent-crimson text-white text-sm font-semibold font-sans hover:-translate-y-0.5 transition-all mt-1"
              >
                + Add Banner
              </button>
            </div>
          )}

          {!isLoading && !isError && banners.length > 0 && (
            <div className="space-y-3">
              {banners.map((b, i) => (
                <BannerCard
                  key={b.id}
                  banner={b}
                  index={i}
                  total={banners.length}
                  onEdit={setEditing}
                  onDelete={setDeletingId}
                  onMoveUp={handleMoveUp}
                  onMoveDn={handleMoveDn}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <BannerFormModal
          mode="create"
          onClose={() => setShowCreate(false)}
          onSuccess={() => setShowCreate(false)}
        />
      )}

      {editing && (
        <BannerFormModal
          mode="edit"
          banner={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => setEditing(null)}
        />
      )}

      {deletingBanner && (
        <DeleteConfirmModal
          banner={deletingBanner}
          loading={deleteBanner.isPending}
          onConfirm={() => {
            deleteBanner.mutate(deletingBanner.id, {
              onSuccess: () => setDeletingId(null),
            });
          }}
          onClose={() => setDeletingId(null)}
        />
      )}
    </AdminLayout>
  );
}
