import { Trash2 } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';

interface DeleteConfirmModalProps {
  itemName:  string;
  onConfirm: () => void;
  onClose:   () => void;
  isLoading: boolean;
}

export function DeleteConfirmModal({ itemName, onConfirm, onClose, isLoading }: DeleteConfirmModalProps) {
  return (
    <Modal open onClose={onClose} maxWidth="max-w-sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-accent-crimson/12 flex items-center justify-center">
          <Trash2 size={24} className="text-accent-crimson" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg text-text-primary">Delete {itemName}?</h3>
          <p className="text-text-muted text-sm font-sans mt-1">
            This action cannot be undone. The record will be soft-deleted.
          </p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-bg-surface2 transition-colors text-sm font-sans"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-accent-crimson text-white text-sm font-semibold font-sans disabled:opacity-60 hover:opacity-90 transition-opacity"
          >
            {isLoading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
