import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { useMockCapture } from '../api/useBooking';
import type { BookingDetailResponse } from '../types';
import type { ApiError } from '@/shared/types';

interface Props {
  providerOrderId: string;
  amount:          number;
  onSuccess:       (detail: BookingDetailResponse) => void;
  onClose:         () => void;
}

type PayMethod = 'card' | 'upi' | 'netbanking' | 'wallet';

const METHODS: { id: PayMethod; label: string; icon: string }[] = [
  { id: 'card',       label: 'Credit / Debit Card', icon: '💳' },
  { id: 'upi',        label: 'UPI',                 icon: '📱' },
  { id: 'netbanking', label: 'Net Banking',          icon: '🏦' },
  { id: 'wallet',     label: 'Wallet',               icon: '💰' },
];

export function MockPaymentModal({ providerOrderId, amount, onSuccess, onClose }: Props) {
  const [method,   setMethod]   = useState<PayMethod>('card');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const capture = useMockCapture();

  async function handleCapture(simulateFailure: boolean) {
    setErrorMsg(null);
    try {
      const result = await capture.mutateAsync({ providerOrderId, simulateFailure });
      // Simulate failure: backend throws 402, so this line only runs on unexpected success
      onSuccess(result);
    } catch (err: unknown) {
      const msg = (err as ApiError)?.message ?? 'Payment failed. Please try again.';
      if (simulateFailure) {
        // Show error inline — modal stays open so user can retry
        setErrorMsg('Payment declined (simulated). Please try again.');
      } else {
        // Unexpected error on real success path — also show inline
        setErrorMsg(msg);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="font-display font-bold text-lg text-text-primary">Test Payment Gateway</h2>
            <p className="text-[11px] text-text-muted font-sans mt-0.5">
              This is a simulated payment — no real money
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={capture.isPending}
            className="w-8 h-8 rounded-full bg-bg-surface2 hover:bg-bg-surface3 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
          >
            ×
          </button>
        </div>

        {/* Amount */}
        <div className="mx-5 mb-4 p-4 rounded-xl bg-bg-base border border-border-default text-center">
          <p className="text-[11px] text-text-muted font-sans uppercase tracking-widest mb-1">Amount to Pay</p>
          <p className="font-display font-black text-3xl text-accent-crimson">₹{amount}</p>
        </div>

        {/* Inline error */}
        {errorMsg && (
          <div className="mx-5 mb-3 p-3 rounded-lg bg-semantic-error/10 border border-semantic-error/30 flex items-center gap-2">
            <span className="text-semantic-error text-sm">✗</span>
            <p className="text-sm text-semantic-error font-sans flex-1">{errorMsg}</p>
            <button onClick={() => setErrorMsg(null)} className="text-semantic-error/60 hover:text-semantic-error text-xs">✕</button>
          </div>
        )}

        {/* Method selector */}
        <div className="px-5 mb-4">
          <p className="text-[11px] text-text-muted font-sans uppercase tracking-wider mb-2">Payment Method</p>
          <div className="space-y-2">
            {METHODS.map((m) => (
              <label
                key={m.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                  method === m.id
                    ? 'border-accent-indigo bg-accent-indigo/10'
                    : 'border-border-default bg-bg-base hover:border-border-strong'
                )}
              >
                <input
                  type="radio"
                  name="method"
                  value={m.id}
                  checked={method === m.id}
                  onChange={() => setMethod(m.id)}
                  className="accent-accent-indigo"
                />
                <span className="text-lg">{m.icon}</span>
                <span className="text-sm font-sans text-text-primary">{m.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-5 pb-5 space-y-2">
          <button
            onClick={() => void handleCapture(false)}
            disabled={capture.isPending}
            className={cn(
              'w-full py-3.5 rounded-xl font-semibold text-sm font-sans transition-all',
              'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
              'shadow-[0_8px_24px_-8px_rgba(16,185,129,0.5)]',
              capture.isPending ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-0.5'
            )}
          >
            {capture.isPending ? 'Processing payment…' : '✓ Simulate Success'}
          </button>

          <button
            onClick={() => void handleCapture(true)}
            disabled={capture.isPending}
            className={cn(
              'w-full py-2.5 rounded-xl text-sm font-sans font-medium transition-colors',
              'border border-semantic-error/40 text-semantic-error hover:bg-semantic-error/5',
              capture.isPending && 'opacity-40 cursor-not-allowed'
            )}
          >
            ✗ Simulate Failure
          </button>
        </div>

        {/* Footer note */}
        <div className="px-5 pb-4 text-center">
          <p className="text-[10px] text-text-muted font-sans leading-relaxed">
            In production, Razorpay will handle UPI, Cards &amp; Net Banking
          </p>
        </div>
      </div>
    </div>
  );
}
