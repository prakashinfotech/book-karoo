import { useState, useEffect, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';
import { AdminLayout } from '@/shared/components/layout/AdminLayout';
import { useAdminSettings, useUpdateSettingsBatch } from '../api/useAdmin';
import type { SettingItem } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

// Settings values are stored either as JSON strings ('"BookKaroo Pvt Ltd"')
// or as raw numbers ('59.00', '2'). JSON.parse returns the correct type;
// only keep the parsed result when it's already a string (i.e. strip quotes).
// For numbers / booleans, return the original raw string so formValues stays string-typed.
function getNestedValue(val: string): string {
  try {
    const parsed = JSON.parse(val);
    return typeof parsed === 'string' ? parsed : val;
  } catch {
    return val;
  }
}

// ── Input Classes ─────────────────────────────────────────────────────────────

const INPUT = 'px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm font-sans focus:outline-none focus:border-accent-indigo transition-colors w-full max-w-48';
const INPUT_FULL = 'px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm font-sans focus:outline-none focus:border-accent-indigo transition-colors w-full';

// ── Section Card ──────────────────────────────────────────────────────────────

interface SectionProps {
  title:    string;
  icon:     string;
  children: React.ReactNode;
  onReset?: () => void;
}

function Section({ title, icon, children, onReset }: SectionProps) {
  return (
    <div className="p-6 rounded-xl bg-bg-surface border border-border-default">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-semibold text-base text-text-primary flex items-center gap-2">
          <span>{icon}</span>{title}
        </h2>
        {onReset && (
          <button onClick={onReset}
            className="text-xs text-text-muted font-sans hover:text-text-primary transition-colors">
            Reset to DB values
          </button>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ── Field Row ─────────────────────────────────────────────────────────────────

interface FieldProps { label: string; helper?: string; children: React.ReactNode }
function Field({ label, helper, children }: FieldProps) {
  return (
    <div className="grid grid-cols-[220px_1fr] items-start gap-4">
      <div>
        <label className="text-sm text-text-secondary font-sans">{label}</label>
        {helper && <p className="text-xs text-text-muted font-sans mt-0.5">{helper}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const { data: settingsArr = [], isLoading } = useAdminSettings();
  const batchUpdate = useUpdateSettingsBatch();

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isDirty,    setIsDirty]    = useState(false);
  const [dbValues,   setDbValues]   = useState<Record<string, string>>({});

  // Initialise form from API
  useEffect(() => {
    if (settingsArr.length === 0) return;
    const map: Record<string, string> = {};
    settingsArr.forEach((s: SettingItem) => { map[s.key] = getNestedValue(s.value); });
    setFormValues(map);
    setDbValues(map);
    setIsDirty(false);
  }, [settingsArr]);

  // Block navigation when dirty
  const blocker = useBlocker(isDirty);
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const ok = window.confirm('Leave page? You have unsaved changes.');
      if (ok) blocker.proceed();
      else    blocker.reset();
    }
  }, [blocker]);

  const set = useCallback((key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  const resetSection = useCallback((keys: string[]) => {
    setFormValues((prev) => {
      const next = { ...prev };
      keys.forEach((k) => { if (dbValues[k] !== undefined) next[k] = dbValues[k]; });
      return next;
    });
  }, [dbValues]);

  const get = (key: string) => formValues[key] ?? '';

  const handleSaveAll = async () => {
    // Ensure every value is a plain string — numeric inputs (type="number")
    // can leave JS numbers in formValues if initialisation didn't coerce them.
    const payload: Record<string, string> = Object.fromEntries(
      Object.entries(formValues).map(([k, v]) => [k, String(v)])
    );
    await batchUpdate.mutateAsync(payload);
    setDbValues(formValues);
    setIsDirty(false);
  };

  const handleDiscard = () => {
    setFormValues(dbValues);
    setIsDirty(false);
  };

  const unsavedCount = Object.keys(formValues).filter((k) => formValues[k] !== dbValues[k]).length;

  const PRICING_KEYS     = ['convenience_fee_per_ticket', 'offer_processing_fee', 'gst_rate', 'max_seats_per_booking', 'seat_lock_minutes'];
  const CANCEL_KEYS      = ['cancellation_window_hours', 'refund_processing_days'];
  const COMPANY_KEYS     = ['company_name', 'company_legal_name', 'company_gstin', 'company_pan', 'company_state_code', 'company_address_line1', 'company_address_line2', 'company_city', 'company_pincode'];
  const SAC_KEYS         = ['sac_code_convenience', 'sac_code_offer'];
  const SUPPORT_KEYS     = ['support_email', 'support_url'];
  const PAYMENT_KEYS     = ['payment_provider'];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-3xl space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-bg-surface2 animate-pulse" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Unsaved Changes Banner */}
      {isDirty && (
        <div className="sticky top-0 z-30 flex items-center justify-between gap-4 px-6 py-3 bg-semantic-warning/20 border-b border-semantic-warning/30 backdrop-blur-sm">
          <span className="text-sm font-sans text-semantic-warning font-semibold">
            ⚠️ You have {unsavedCount} unsaved change{unsavedCount !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-3">
            <button onClick={handleDiscard}
              className="text-sm font-sans text-text-muted hover:text-text-primary transition-colors underline">
              Discard
            </button>
            <button onClick={handleSaveAll} disabled={batchUpdate.isPending}
              className="px-4 py-1.5 rounded-full bg-accent-crimson text-white text-sm font-semibold font-sans hover:-translate-y-0.5 transition-all disabled:opacity-50">
              {batchUpdate.isPending ? 'Saving…' : 'Save All'}
            </button>
          </div>
        </div>
      )}

      <div className="p-6 max-w-3xl space-y-5">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl tracking-tight">Settings</h1>
            <p className="text-text-muted text-sm font-sans mt-1">Configure platform-wide settings.</p>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={!isDirty || batchUpdate.isPending}
            className="relative px-5 py-2 rounded-full bg-accent-crimson text-white text-sm font-semibold font-sans hover:-translate-y-0.5 transition-all disabled:opacity-40"
          >
            {batchUpdate.isPending ? 'Saving…' : 'Save All Changes'}
            {isDirty && unsavedCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-semantic-warning text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unsavedCount}
              </span>
            )}
          </button>
        </div>

        {/* Section: Pricing & Fees */}
        <Section title="Pricing & Fees" icon="💰" onReset={() => resetSection(PRICING_KEYS)}>
          <Field label="Convenience Fee per Ticket">
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-sm font-sans">₹</span>
              <input type="number" min="0" step="1" value={get('convenience_fee_per_ticket')}
                onChange={(e) => set('convenience_fee_per_ticket', e.target.value)}
                className={INPUT} />
            </div>
          </Field>
          <Field label="Offer Processing Fee">
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-sm font-sans">₹</span>
              <input type="number" min="0" step="1" value={get('offer_processing_fee')}
                onChange={(e) => set('offer_processing_fee', e.target.value)}
                className={INPUT} />
            </div>
          </Field>
          <Field label="GST Rate" helper="Stored as decimal (0.18 = 18%)">
            <div className="flex items-center gap-2">
              <input type="number" min="0" max="100" step="0.01"
                value={get('gst_rate') ? (parseFloat(get('gst_rate')) * 100).toFixed(2) : ''}
                onChange={(e) => set('gst_rate', String(parseFloat(e.target.value) / 100))}
                className={INPUT} />
              <span className="text-text-muted text-sm font-sans">%</span>
            </div>
          </Field>
          <Field label="Max Seats per Booking">
            <input type="number" min="1" max="20" value={get('max_seats_per_booking')}
              onChange={(e) => set('max_seats_per_booking', e.target.value)}
              className={INPUT} />
          </Field>
          <Field label="Seat Lock Duration">
            <div className="flex items-center gap-2">
              <input type="number" min="1" max="30" value={get('seat_lock_minutes')}
                onChange={(e) => set('seat_lock_minutes', e.target.value)}
                className={INPUT} />
              <span className="text-text-muted text-sm font-sans">min</span>
            </div>
          </Field>
        </Section>

        {/* Section: Cancellation Policy */}
        <Section title="Cancellation Policy" icon="🚫" onReset={() => resetSection(CANCEL_KEYS)}>
          <Field label="Cancellation Window" helper="Bookings cannot be cancelled within X hours of showtime">
            <div className="flex items-center gap-2">
              <input type="number" min="0" max="48" value={get('cancellation_window_hours')}
                onChange={(e) => set('cancellation_window_hours', e.target.value)}
                className={INPUT} />
              <span className="text-text-muted text-sm font-sans">hours before show</span>
            </div>
          </Field>
          <Field label="Refund Processing Time">
            <div className="flex items-center gap-2">
              <input type="number" min="1" max="30" value={get('refund_processing_days')}
                onChange={(e) => set('refund_processing_days', e.target.value)}
                className={INPUT} />
              <span className="text-text-muted text-sm font-sans">business days</span>
            </div>
          </Field>
        </Section>

        {/* Section: Company Details */}
        <Section title="Company Details" icon="🏢" onReset={() => resetSection(COMPANY_KEYS)}>
          <div className="text-xs text-semantic-warning font-sans px-3 py-2 rounded-lg bg-semantic-warning/10 border border-semantic-warning/20 mb-2">
            ⚠️ Used on GST invoices. Update before going live.
          </div>
          <Field label="Company Name">
            <input type="text" value={get('company_name')}
              onChange={(e) => set('company_name', e.target.value)}
              className={INPUT_FULL} />
          </Field>
          <Field label="Legal Name">
            <input type="text" value={get('company_legal_name')}
              onChange={(e) => set('company_legal_name', e.target.value)}
              className={INPUT_FULL} />
          </Field>
          <Field label="GSTIN" helper="Format: 22AAAAA0000A1Z5">
            <input type="text" value={get('company_gstin')}
              onChange={(e) => set('company_gstin', e.target.value)}
              className={INPUT_FULL} placeholder="24XXXXX0000X1Z5" />
          </Field>
          <Field label="PAN" helper="Format: AAAAA0000A">
            <input type="text" value={get('company_pan')}
              onChange={(e) => set('company_pan', e.target.value)}
              className={INPUT_FULL} placeholder="XXXXX0000X" />
          </Field>
          <Field label="State Code">
            <input type="text" value={get('company_state_code')}
              onChange={(e) => set('company_state_code', e.target.value)}
              className={INPUT} placeholder="24" />
          </Field>
          <Field label="Address Line 1">
            <input type="text" value={get('company_address_line1')}
              onChange={(e) => set('company_address_line1', e.target.value)}
              className={INPUT_FULL} />
          </Field>
          <Field label="Address Line 2">
            <input type="text" value={get('company_address_line2')}
              onChange={(e) => set('company_address_line2', e.target.value)}
              className={INPUT_FULL} />
          </Field>
          <Field label="City">
            <input type="text" value={get('company_city')}
              onChange={(e) => set('company_city', e.target.value)}
              className={INPUT} />
          </Field>
          <Field label="Pincode">
            <input type="text" value={get('company_pincode')}
              onChange={(e) => set('company_pincode', e.target.value)}
              className={INPUT} placeholder="380054" />
          </Field>
        </Section>

        {/* Section: SAC Codes */}
        <Section title="Tax / SAC Codes" icon="📋" onReset={() => resetSection(SAC_KEYS)}>
          <div className="text-xs text-text-muted font-sans px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default mb-2">
            SAC codes for GST classification. Do not change unless advised by your CA.
          </div>
          <Field label="SAC — Convenience Fee">
            <input type="text" value={get('sac_code_convenience')}
              onChange={(e) => set('sac_code_convenience', e.target.value)}
              className={INPUT} />
          </Field>
          <Field label="SAC — Offer Processing">
            <input type="text" value={get('sac_code_offer')}
              onChange={(e) => set('sac_code_offer', e.target.value)}
              className={INPUT} />
          </Field>
        </Section>

        {/* Section: Support */}
        <Section title="Support" icon="💬" onReset={() => resetSection(SUPPORT_KEYS)}>
          <Field label="Support Email">
            <input type="email" value={get('support_email')}
              onChange={(e) => set('support_email', e.target.value)}
              className={INPUT_FULL} />
          </Field>
          <Field label="Support URL">
            <input type="url" value={get('support_url')}
              onChange={(e) => set('support_url', e.target.value)}
              className={INPUT_FULL} />
          </Field>
        </Section>

        {/* Section: Payment */}
        <Section title="Payment" icon="💳" onReset={() => resetSection(PAYMENT_KEYS)}>
          <Field label="Payment Provider">
            <div className="flex gap-2">
              {(['mock', 'razorpay', 'paypal'] as const).map((p) => (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payment_provider"
                    value={p}
                    checked={get('payment_provider') === p}
                    onChange={() => set('payment_provider', p)}
                    className="accent-accent-indigo"
                  />
                  <span className="text-sm font-sans text-text-secondary capitalize">{p === 'mock' ? 'Mock (Test)' : p === 'razorpay' ? 'Razorpay' : 'PayPal'}</span>
                </label>
              ))}
            </div>
            {get('payment_provider') === 'mock' && (
              <div className="mt-2 text-xs text-semantic-warning font-sans px-3 py-2 rounded-lg bg-semantic-warning/10 border border-semantic-warning/20">
                ⚠️ Mock provider is for testing only. Switch to Razorpay before launch.
              </div>
            )}
          </Field>
        </Section>
      </div>
    </AdminLayout>
  );
}
