import { useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';

interface Props {
  userName:     string;
  tempPassword: string;
  onClose:      () => void;
}

export function TempPasswordModal({ userName, tempPassword, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(tempPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Modal open onClose={onClose} maxWidth="max-w-sm">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <CheckCircle size={20} className="text-semantic-success flex-shrink-0" />
          <h3 className="font-display font-bold text-lg text-semantic-success">Password Reset</h3>
          <button onClick={onClose} className="ml-auto text-text-muted hover:text-text-primary"><X size={18} /></button>
        </div>

        <p className="text-[13px] text-text-secondary font-sans">
          A temporary password has been generated for <strong>{userName}</strong>:
        </p>

        {/* Password display */}
        <div className="bg-bg-surface3 rounded-xl p-4 text-center">
          <p className="font-mono text-[22px] font-bold tracking-widest text-text-primary letter-spacing-wide">
            {tempPassword}
          </p>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="w-full py-2.5 rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-surface2 transition-colors text-sm font-semibold"
        >
          {copied ? '✅ Copied!' : 'Copy Password'}
        </button>

        {/* Warning text */}
        <div className="text-center space-y-1">
          <p className="text-[11px] text-text-muted font-sans">Share this with the user securely.</p>
          <p className="text-[11px] text-text-muted font-sans">This password will not be shown again.</p>
          <p className="text-[11px] text-text-muted font-sans">The user will be logged out of all sessions.</p>
        </div>

        {/* Done */}
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
