import { useState } from 'react';
import { CircleDollarSign, X } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { useAdminRefund } from '../api/useAdmin';
import type { AdminBooking } from '../types';

interface Props {
  booking:   AdminBooking;
  onClose:   () => void;
  onSuccess: () => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
}

export function RefundModal({ booking, onClose, onSuccess }: Props) {
  const convFeeTotal      = booking.convenienceFee + booking.cgst + booking.sgst + booking.igst;
  const minusConvAmount   = Math.max(0, booking.amountPaid - convFeeTotal);
  const [amount, setAmount] = useState(minusConvAmount);
  const [preset, setPreset] = useState<'full' | 'minusConv' | 'custom'>('minusConv');

  const adminRefund = useAdminRefund();

  const isValid = amount > 0 && amount <= booking.amountPaid;

  function selectPreset(p: 'full' | 'minusConv' | 'custom', val?: number) {
    setPreset(p);
    if (p === 'full')      setAmount(booking.amountPaid);
    if (p === 'minusConv') setAmount(minusConvAmount);
    if (p === 'custom' && val !== undefined) setAmount(val);
  }

  function handleSubmit() {
    adminRefund.mutate(
      { ref: booking.bookingRef, amount },
      {
        onSuccess: () => { onSuccess(); onClose(); },
      }
    );
  }

  return (
    <Modal open onClose={onClose} maxWidth="max-w-sm">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <CircleDollarSign size={20} className="text-semantic-warning flex-shrink-0" />
          <h3 className="font-display font-bold text-lg text-semantic-warning">Process Refund</h3>
          <button onClick={onClose} className="ml-auto text-text-muted hover:text-text-primary"><X size={18} /></button>
        </div>

        <p className="text-[13px] text-text-muted font-sans">
          {booking.bookingRef} · {booking.userName}
        </p>

        <div className="text-center">
          <p className="text-[11px] text-text-muted uppercase tracking-wider font-sans">Amount Paid</p>
          <p className="text-2xl font-bold text-text-primary font-display">{fmt(booking.amountPaid)}</p>
        </div>

        {/* Quick-select buttons */}
        <div className="space-y-2">
          <button
            onClick={() => selectPreset('full')}
            className={`w-full py-2 rounded-lg text-[13px] font-semibold border-2 transition-colors ${
              preset === 'full'
                ? 'border-semantic-warning bg-semantic-warning/10 text-semantic-warning'
                : 'border-border-default text-text-secondary hover:border-semantic-warning'
            }`}
          >
            Full Refund — {fmt(booking.amountPaid)}
          </button>
          <button
            onClick={() => selectPreset('minusConv')}
            className={`w-full py-2 rounded-lg text-[13px] font-semibold border-2 transition-colors ${
              preset === 'minusConv'
                ? 'border-semantic-warning bg-semantic-warning/10 text-semantic-warning'
                : 'border-border-default text-text-secondary hover:border-semantic-warning'
            }`}
          >
            Minus Conv. Fee — {fmt(minusConvAmount)}
          </button>
          <button
            onClick={() => selectPreset('custom')}
            className={`w-full py-2 rounded-lg text-[13px] font-semibold border-2 transition-colors ${
              preset === 'custom'
                ? 'border-semantic-warning bg-semantic-warning/10 text-semantic-warning'
                : 'border-border-default text-text-secondary hover:border-semantic-warning'
            }`}
          >
            Custom Amount
          </button>
        </div>

        {/* Amount input */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-mono text-sm">₹</span>
          <input
            type="number"
            min={0.01}
            max={booking.amountPaid}
            step={0.01}
            value={amount}
            onChange={(e) => { setPreset('custom'); setAmount(Number(e.target.value)); }}
            className={`w-full pl-7 pr-3 py-2.5 rounded-lg border text-text-primary text-sm bg-bg-surface2 focus:outline-none font-mono ${
              !isValid ? 'border-semantic-error' : 'border-border-default focus:border-semantic-warning'
            }`}
          />
        </div>
        {!isValid && (
          <p className="text-[11px] text-semantic-error">Amount must be between ₹0.01 and {fmt(booking.amountPaid)}</p>
        )}

        {/* Warning */}
        <div className="rounded-lg border border-semantic-warning/30 bg-semantic-warning/10 p-3 text-[12px] font-sans space-y-0.5">
          <p className="font-semibold text-semantic-warning">⚠️ This is a test mode refund.</p>
          <p className="text-text-muted">No real money will be moved.</p>
          <p className="text-text-muted">In production, this triggers a payment gateway refund.</p>
        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-bg-surface2 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || adminRefund.isPending}
            className="flex-1 py-2 rounded-lg bg-semantic-warning text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
          >
            {adminRefund.isPending ? 'Processing…' : `Process ${fmt(amount)} Refund`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
