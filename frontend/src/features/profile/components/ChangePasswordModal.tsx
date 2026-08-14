import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, X } from 'lucide-react';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { useChangePassword } from '../api/useProfile';
import { toast } from '@/shared/components/ui/Toast';
import type { ApiError } from '@/shared/types';

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^a-zA-Z0-9]/, 'Must contain a special character'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onClose: () => void;
}

export function ChangePasswordModal({ onClose }: Props) {
  const { mutate: changePassword, isPending } = useChangePassword();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  function onSubmit(data: FormValues) {
    setApiError(null);
    changePassword(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          toast('Password updated successfully!', 'success');
          onClose();
        },
        onError: (err: unknown) => {
          const e = err as ApiError;
          setApiError(e?.message ?? 'Failed to update password. Please try again.');
        },
      },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-bg-surface rounded-2xl border border-border-default shadow-[0_24px_64px_rgba(0,0,0,0.6)] p-7">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg font-sans">Change Password</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Current Password"
            type={showCurrent ? 'text' : 'password'}
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            rightElement={
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="text-text-muted hover:text-text-primary transition-colors"
                tabIndex={-1}
                aria-label={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            {...register('currentPassword')}
          />

          <Input
            label="New Password"
            type={showNew ? 'text' : 'password'}
            autoComplete="new-password"
            error={errors.newPassword?.message}
            rightElement={
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="text-text-muted hover:text-text-primary transition-colors"
                tabIndex={-1}
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            {...register('newPassword')}
          />

          <Input
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {apiError && (
            <div className="px-4 py-3 rounded-lg bg-semantic-error/10 border border-semantic-error/25 text-sm text-semantic-error font-sans">
              {apiError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full bg-bg-surface2 border border-border-default text-sm text-text-secondary hover:text-text-primary transition-colors font-sans"
            >
              Cancel
            </button>
            <Button type="submit" className="flex-1" loading={isPending}>
              {isPending ? 'Updating…' : 'Update Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
