import { useState, useEffect, useRef } from 'react';
import { Search, X, CheckCircle, Plus, Building2, User, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AdminLayout } from '@/shared/components/layout/AdminLayout';
import { AdminTable, type Column } from '../components/AdminTable';
import { Modal } from '@/shared/components/ui/Modal';
import { api } from '@/shared/lib/api';
import {
  useAdminPartners, useCreatePartner, useDeactivatePartner, useActivatePartner,
  useGrantPartnerVenue, useRevokePartnerVenue,
  type CreatePartnerRequest,
} from '../api/useAdminPartners';
import type { AdminPartnerResponse, CreatePartnerResponse } from '@/features/partner/types';

interface VenueOption { id: string; name: string; cityName: string; }

const createSchema = z.object({
  email:         z.string().email('Invalid email'),
  name:          z.string().min(2, 'Name required'),
  mobile:        z.string().min(10, 'Mobile required'),
  businessName:  z.string().min(2, 'Business name required'),
  contactPerson: z.string().min(2, 'Contact person required'),
  contactPhone:  z.string().min(10, 'Phone required'),
  contactEmail:  z.string().email('Invalid email'),
  gstNumber:     z.string().optional(),
  panNumber:     z.string().optional(),
  notes:         z.string().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

interface CreatePartnerModalProps {
  onClose: () => void;
}

function CreatePartnerModal({ onClose }: CreatePartnerModalProps) {
  const createPartner = useCreatePartner();
  const [created, setCreated] = useState<CreatePartnerResponse | null>(null);
  const [selectedVenueIds, setSelectedVenueIds] = useState<string[]>([]);
  const [venueSearch, setVenueSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: venues } = useQuery<VenueOption[]>({
    queryKey: ['admin', 'venues-simple'],
    queryFn: () =>
      api.get<{ items: VenueOption[] }>('/api/admin/venues', { params: { pageSize: 200 } })
        .then((r) => r.data.items ?? []),
    staleTime: 5 * 60_000,
  });

  // Fetch all partners to know which venues are already assigned to someone
  const { data: existingPartners } = useQuery<AdminPartnerResponse[]>({
    queryKey: ['admin', 'partners-all-for-venue-filter'],
    queryFn: () =>
      api.get<{ items: AdminPartnerResponse[] }>('/api/admin/partners', { params: { pageSize: 500 } })
        .then(r => r.data.items ?? []),
    staleTime: 60_000,
  });

  // Venue IDs already assigned to any partner — exclude these from the list
  const assignedVenueIds = new Set(
    (existingPartners ?? []).flatMap(p => p.venueAccess.map(v => v.venueId))
  );
  const availableVenues = (venues ?? []).filter(v => !assignedVenueIds.has(v.id));

  const { register, handleSubmit, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });

  function onSubmit(formData: CreateForm) {
    const payload: CreatePartnerRequest = { ...formData, venueIds: selectedVenueIds };
    createPartner.mutate(payload, {
      onSuccess: (result) => setCreated(result),
    });
  }

  function handleCopy() {
    if (!created) return;
    navigator.clipboard.writeText(created.tempPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function toggleVenue(id: string) {
    setSelectedVenueIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  if (created) {
    return (
      <Modal open onClose={onClose} maxWidth="max-w-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-semantic-success flex-shrink-0" />
            <h3 className="font-display font-bold text-lg text-semantic-success">Partner Created</h3>
            <button onClick={onClose} className="ml-auto text-text-muted hover:text-text-primary"><X size={18} /></button>
          </div>

          <p className="text-[13px] text-text-secondary">
            Partner account created for <strong>{created.partner.userName}</strong>. Share this temporary password securely:
          </p>

          <div className="bg-bg-surface3 rounded-xl p-4 text-center">
            <p className="font-mono text-[22px] font-bold tracking-widest text-text-primary">
              {created.tempPassword}
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="w-full py-2.5 rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-surface2 transition-colors text-sm font-semibold"
          >
            {copied ? 'Copied!' : 'Copy Password'}
          </button>

          <div className="text-center space-y-1">
            <p className="text-[11px] text-text-muted">This password will not be shown again.</p>
            <p className="text-[11px] text-text-muted">User must change it on first login.</p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-accent-crimson text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-xl text-text-primary">Create Partner</h2>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Account Details</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">Email *</label>
            <input {...register('email')} className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
            {errors.email && <p className="text-xs text-semantic-error mt-0.5">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Full Name *</label>
            <input {...register('name')} className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
            {errors.name && <p className="text-xs text-semantic-error mt-0.5">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Mobile *</label>
            <input {...register('mobile')} className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo" placeholder="+91" />
            {errors.mobile && <p className="text-xs text-semantic-error mt-0.5">{errors.mobile.message}</p>}
          </div>
        </div>

        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide pt-1">Business Details</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-text-muted mb-1">Business Name *</label>
            <input {...register('businessName')} className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
            {errors.businessName && <p className="text-xs text-semantic-error mt-0.5">{errors.businessName.message}</p>}
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Contact Person *</label>
            <input {...register('contactPerson')} className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
            {errors.contactPerson && <p className="text-xs text-semantic-error mt-0.5">{errors.contactPerson.message}</p>}
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Contact Phone *</label>
            <input {...register('contactPhone')} className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
            {errors.contactPhone && <p className="text-xs text-semantic-error mt-0.5">{errors.contactPhone.message}</p>}
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Contact Email *</label>
            <input {...register('contactEmail')} className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
            {errors.contactEmail && <p className="text-xs text-semantic-error mt-0.5">{errors.contactEmail.message}</p>}
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">GST Number</label>
            <input {...register('gstNumber')} className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">PAN Number</label>
            <input {...register('panNumber')} className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-text-muted mb-1">Notes</label>
          <textarea {...register('notes')} rows={2} className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo resize-none" />
        </div>

        {venues && venues.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
              Grant Venue Access (optional)
              {selectedVenueIds.length > 0 && (
                <span className="ml-2 text-accent-indigo normal-case font-medium">
                  {selectedVenueIds.length} selected
                </span>
              )}
            </p>

            {availableVenues.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-3 border border-dashed border-border-default rounded-lg">
                All venues are already assigned to other partners.
              </p>
            ) : (
              <>
                {/* Venue search box */}
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    type="text"
                    value={venueSearch}
                    onChange={e => setVenueSearch(e.target.value)}
                    placeholder="Search venues…"
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-border-default bg-bg-surface2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[#4F46E5] transition-colors"
                  />
                  {venueSearch && (
                    <button
                      type="button"
                      onClick={() => setVenueSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="max-h-40 overflow-y-auto space-y-0.5 border border-border-default rounded-lg p-1.5">
                  {availableVenues
                    .filter(v =>
                      !venueSearch.trim() ||
                      v.name.toLowerCase().includes(venueSearch.toLowerCase()) ||
                      v.cityName.toLowerCase().includes(venueSearch.toLowerCase())
                    )
                    .map((v) => (
                      <label key={v.id} className="flex items-center gap-2 cursor-pointer hover:bg-bg-surface2 px-2 py-1.5 rounded-md transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedVenueIds.includes(v.id)}
                          onChange={() => toggleVenue(v.id)}
                          className="accent-accent-indigo flex-shrink-0"
                        />
                        <span className="text-sm text-text-primary flex-1 truncate">{v.name}</span>
                        <span className="text-xs text-text-muted flex-shrink-0">{v.cityName}</span>
                      </label>
                    ))}
                  {availableVenues.filter(v =>
                    !venueSearch.trim() ||
                    v.name.toLowerCase().includes(venueSearch.toLowerCase()) ||
                    v.cityName.toLowerCase().includes(venueSearch.toLowerCase())
                  ).length === 0 && (
                    <p className="text-xs text-text-muted text-center py-3">No venues match "{venueSearch}"</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {createPartner.isError && (
          <p className="text-xs text-semantic-error">Failed to create partner. Please check inputs and try again.</p>
        )}

        <div className="flex gap-3 pt-2 sticky bottom-0 bg-bg-surface pb-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-border-default text-text-secondary text-sm hover:bg-bg-surface2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createPartner.isPending}
            className="flex-1 py-2.5 rounded-lg bg-accent-crimson text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {createPartner.isPending ? 'Creating…' : 'Create Partner'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Partner Detail Drawer ────────────────────────────────────────────────────

interface DrawerProps {
  partner: AdminPartnerResponse;
  onClose: () => void;
}

function PartnerDetailDrawer({ partner, onClose }: DrawerProps) {
  const [tab, setTab] = useState<'profile' | 'venues'>('profile');
  const [venueSearch, setVenueSearch] = useState('');
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);

  const grant  = useGrantPartnerVenue();
  const revoke = useRevokePartnerVenue();

  const { data: allVenues } = useQuery<VenueOption[]>({
    queryKey: ['admin', 'venues-simple'],
    queryFn: () =>
      api.get<{ items: VenueOption[] }>('/api/admin/venues', { params: { pageSize: 200 } })
        .then(r => r.data.items ?? []),
    staleTime: 5 * 60_000,
  });

  const grantedIds = new Set(partner.venueAccess.map(v => v.venueId));
  const availableVenues = (allVenues ?? []).filter(v =>
    !grantedIds.has(v.id) &&
    (!venueSearch.trim() ||
      v.name.toLowerCase().includes(venueSearch.toLowerCase()) ||
      v.cityName.toLowerCase().includes(venueSearch.toLowerCase()))
  );

  function handleGrant() {
    if (!selectedVenueId) return;
    grant.mutate(
      { partnerId: partner.id, venueId: selectedVenueId },
      { onSuccess: () => { setSelectedVenueId(''); setVenueSearch(''); } }
    );
  }

  function handleRevoke(venueId: string) {
    revoke.mutate(
      { partnerId: partner.id, venueId },
      { onSuccess: () => setRevokeConfirm(null) }
    );
  }

  const tabCls = (t: typeof tab) =>
    `flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
      tab === t ? 'text-[#E11D74]' : 'text-text-muted hover:text-text-secondary'
    }`;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/25" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-[60] w-[460px] bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.12)] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border-default flex-shrink-0">
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">Partner</p>
            <h2 className="font-display font-bold text-lg text-text-primary leading-tight">{partner.businessName}</h2>
            <p className="text-sm text-text-secondary mt-0.5">{partner.userName} · {partner.userEmail}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-bg-surface2 transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 py-3 border-b border-border-default flex-shrink-0" style={{ background: '#F1F2F4' }}>
          <button
            className={tabCls('profile')}
            style={tab === 'profile' ? { background: '#FFF0F2', boxShadow: '0 1px 3px rgba(225, 29, 116,0.15)' } : {}}
            onClick={() => setTab('profile')}
          >
            <User size={13} />Profile
          </button>
          <button
            className={tabCls('venues')}
            style={tab === 'venues' ? { background: '#FFF0F2', boxShadow: '0 1px 3px rgba(225, 29, 116,0.15)' } : {}}
            onClick={() => setTab('venues')}
          >
            <Building2 size={13} />
            Venue Access
            <span
              className="text-[10px] rounded-full px-1.5 py-0.5 font-bold"
              style={{ background: 'rgba(225, 29, 116,0.12)', color: '#E11D74' }}
            >
              {partner.venueAccess.length}
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── Profile tab ── */}
          {tab === 'profile' && (
            <div className="space-y-5">
              <section>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">User Account</p>
                <div className="space-y-2">
                  {[
                    { label: 'Name',   value: partner.userName },
                    { label: 'Email',  value: partner.userEmail },
                    { label: 'Mobile', value: partner.userMobile ?? '—' },
                    { label: 'Status', value: partner.isActive ? 'Active' : 'Inactive' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center gap-2 text-sm">
                      <span className="w-20 text-text-muted flex-shrink-0">{label}</span>
                      <span className="text-text-primary font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="border-t border-border-default" />

              <section>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">Business Details</p>
                <div className="space-y-2">
                  {[
                    { label: 'Business',  value: partner.businessName },
                    { label: 'Contact',   value: partner.contactPerson },
                    { label: 'Phone',     value: partner.contactPhone },
                    { label: 'Email',     value: partner.contactEmail },
                    { label: 'GST',       value: partner.gstNumber ?? '—' },
                    { label: 'PAN',       value: partner.panNumber  ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center gap-2 text-sm">
                      <span className="w-20 text-text-muted flex-shrink-0">{label}</span>
                      <span className="text-text-primary font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              {partner.notes && (
                <>
                  <div className="border-t border-border-default" />
                  <section>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Admin Notes</p>
                    <p className="text-sm text-text-secondary">{partner.notes}</p>
                  </section>
                </>
              )}
            </div>
          )}

          {/* ── Venue Access tab ── */}
          {tab === 'venues' && (
            <div className="space-y-5">

              {/* Current venues */}
              <section>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">
                  Current Access ({partner.venueAccess.length})
                </p>

                {partner.venueAccess.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-4 border border-dashed border-border-default rounded-lg">
                    No venues assigned yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {partner.venueAccess.map(v => (
                      <div key={v.venueId} className="flex items-center gap-3 p-3 rounded-lg border border-border-default bg-bg-surface2">
                        <Building2 size={15} className="text-accent-indigo flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">{v.venueName}</p>
                          <p className="text-xs text-text-muted">{v.cityName}</p>
                          {(v.contactPhone || v.contactEmail) && (
                            <div className="mt-0.5 space-y-0.5">
                              {v.contactPhone && <p className="text-[11px] text-text-secondary">{v.contactPhone}</p>}
                              {v.contactEmail && <p className="text-[11px] text-text-secondary">{v.contactEmail}</p>}
                            </div>
                          )}
                        </div>
                        {revokeConfirm === v.venueId ? (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-xs text-text-muted">Revoke?</span>
                            <button
                              onClick={() => handleRevoke(v.venueId)}
                              disabled={revoke.isPending}
                              className="px-2.5 py-1 text-xs rounded-md font-semibold"
                              style={{ background: '#E11D74', color: '#fff' }}
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setRevokeConfirm(null)}
                              className="px-2.5 py-1 text-xs rounded-md border border-border-default text-text-secondary hover:bg-bg-surface2"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRevokeConfirm(v.venueId)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-semantic-error border border-semantic-error/30 hover:bg-semantic-error/08 transition-colors flex-shrink-0"
                          >
                            <Trash2 size={11} /> Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <div className="border-t border-border-default" />

              {/* Grant venue access */}
              <section>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">
                  Grant Venue Access
                </p>

                <div className="relative mb-2">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                  <input
                    type="text"
                    value={venueSearch}
                    onChange={e => { setVenueSearch(e.target.value); setSelectedVenueId(''); }}
                    placeholder="Search venues…"
                    className="w-full pl-8 pr-8 py-2 text-sm rounded-lg border border-border-default bg-bg-surface2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[#4F46E5] transition-colors"
                  />
                  {venueSearch && (
                    <button
                      onClick={() => { setVenueSearch(''); setSelectedVenueId(''); }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="max-h-44 overflow-y-auto border border-border-default rounded-lg divide-y divide-border-default mb-3">
                  {availableVenues.length === 0 ? (
                    <p className="text-xs text-text-muted text-center py-4">
                      {grantedIds.size === allVenues?.length ? 'All venues already granted' : 'No venues match'}
                    </p>
                  ) : (
                    availableVenues.map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVenueId(v.id === selectedVenueId ? '' : v.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors ${
                          selectedVenueId === v.id
                            ? 'bg-accent-indigo/10 text-accent-indigo font-semibold'
                            : 'hover:bg-bg-surface2 text-text-primary'
                        }`}
                      >
                        <span className="truncate">{v.name}</span>
                        <span className="text-xs text-text-muted ml-2 flex-shrink-0">{v.cityName}</span>
                      </button>
                    ))
                  )}
                </div>

                <button
                  onClick={handleGrant}
                  disabled={!selectedVenueId || grant.isPending}
                  className="bk-btn-primary w-full"
                  style={{ background: !selectedVenueId ? undefined : '#E11D74' }}
                >
                  {grant.isPending ? 'Granting…' : 'Grant Access'}
                </button>
              </section>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function AdminPartnersPage() {
  const [search, setSearch]               = useState('');
  const [debouncedSearch, setDebounced]   = useState('');
  const [isActiveFilter, setIsActive]     = useState<string>('');
  const [page, setPage]                   = useState(1);
  const [showCreate, setShowCreate]       = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<AdminPartnerResponse | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const { data, isLoading } = useAdminPartners({
    search:   debouncedSearch || undefined,
    isActive: isActiveFilter === '' ? undefined : isActiveFilter === 'true',
    page,
    pageSize: 15,
  });
  const deactivate = useDeactivatePartner();
  const activate   = useActivatePartner();

  const partners = data?.items ?? [];
  const liveSelectedPartner = selectedPartner
    ? (partners.find(p => p.id === selectedPartner.id) ?? selectedPartner)
    : null;

  const columns: Column<AdminPartnerResponse>[] = [
    {
      key: 'partner', header: 'Partner',
      render: (p) => (
        <div>
          <p className="text-[13px] font-semibold text-text-primary">{p.businessName}</p>
          <p className="text-[11px] text-text-muted">{p.contactPerson}</p>
        </div>
      ),
    },
    {
      key: 'user', header: 'User Account',
      render: (p) => (
        <div>
          <p className="text-[13px] text-text-primary">{p.userName}</p>
          <p className="text-[11px] text-text-muted">{p.userEmail}</p>
        </div>
      ),
    },
    {
      key: 'contact', header: 'Contact',
      render: (p) => (
        <div>
          <p className="text-[12px] text-text-secondary">{p.contactPhone}</p>
          <p className="text-[11px] text-text-muted">{p.contactEmail}</p>
        </div>
      ),
    },
    {
      key: 'venues', header: 'Venues',
      render: (p) => (
        <div>
          {p.venueAccess.length === 0 ? (
            <span className="text-[11px] text-text-muted">No venues</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {p.venueAccess.slice(0, 2).map((v) => (
                <span key={v.venueId} className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-indigo/12 text-accent-indigo">{v.venueName}</span>
              ))}
              {p.venueAccess.length > 2 && (
                <span className="text-[10px] text-text-muted">+{p.venueAccess.length - 2} more</span>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (p) => (
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.isActive ? 'bg-semantic-success/15 text-semantic-success' : 'bg-bg-surface3 text-text-muted'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-semantic-success' : 'bg-text-muted'}`} />
          {p.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions', header: 'Actions',
      render: (p) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedPartner(p)}
            className="px-2.5 py-1 rounded-lg border border-accent-indigo/40 text-accent-indigo text-[11px] font-medium hover:bg-accent-indigo/08 transition-colors"
          >
            Manage
          </button>
          {p.isActive ? (
            <button
              onClick={() => deactivate.mutate(p.id)}
              disabled={deactivate.isPending}
              className="px-2.5 py-1 rounded-lg border border-semantic-error/40 text-semantic-error text-[11px] hover:bg-semantic-error/08 transition-colors disabled:opacity-50"
            >
              Deactivate
            </button>
          ) : (
            <button
              onClick={() => activate.mutate(p.id)}
              disabled={activate.isPending}
              className="px-2.5 py-1 rounded-lg border border-semantic-success/40 text-semantic-success text-[11px] hover:bg-semantic-success/08 transition-colors disabled:opacity-50"
            >
              Activate
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl mb-1 tracking-tight">
              Partners
              {data && <span className="ml-2 text-base font-normal text-text-muted">({data.total})</span>}
            </h1>
            <p className="text-text-muted text-sm">Manage venue partner accounts and their venue access.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-crimson text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={15} /> Create Partner
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search business name, email…"
              className="w-full pl-8 pr-8 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <X size={12} />
              </button>
            )}
          </div>
          <select
            value={isActiveFilter}
            onChange={(e) => { setIsActive(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo [color-scheme:dark]"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <AdminTable
          columns={columns}
          data={partners}
          isLoading={isLoading}
          emptyMessage="No partners found. Create your first partner."
        />

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-text-muted">{data.total} partners</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded-lg border border-border-default text-sm text-text-secondary disabled:opacity-40">← Prev</button>
              <span className="px-3 py-1 text-sm text-text-primary">Page {page} / {data.totalPages}</span>
              <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded-lg border border-border-default text-sm text-text-secondary disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {showCreate && <CreatePartnerModal onClose={() => setShowCreate(false)} />}
      {liveSelectedPartner && (
        <PartnerDetailDrawer
          partner={liveSelectedPartner}
          onClose={() => setSelectedPartner(null)}
        />
      )}
    </AdminLayout>
  );
}
