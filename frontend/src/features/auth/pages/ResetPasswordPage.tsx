import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { ROUTES } from '@/shared/constants';
import { useResetPassword } from '../api/useAuth';
import type { ApiError } from '@/shared/types';

const schema = z.object({
  newPassword: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^a-zA-Z0-9]/, 'Must contain a special character'),
  confirm: z.string(),
}).refine((d) => d.newPassword === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { mutate: resetPassword, isPending } = useResetPassword();
  const [showPwd, setShowPwd] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-bg-base">
        <div className="text-center space-y-4">
          <p className="text-semantic-error font-sans">Invalid or missing reset token.</p>
          <Link to={ROUTES.FORGOT_PASSWORD} className="text-accent-indigo hover:underline text-sm font-sans">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  function onSubmit(data: FormValues) {
    setApiError(null);
    resetPassword(
      { token, newPassword: data.newPassword },
      {
        onError: (err: unknown) => {
          const e = err as ApiError;
          setApiError(e?.message ?? 'Reset failed. The link may have expired.');
        },
      }
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg-base">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to={ROUTES.HOME}>
            <span className="font-display font-bold text-xl text-text-primary">
              Book<span className="text-accent-crimson">Karoo</span>
            </span>
          </Link>
        </div>

        <div className="bg-bg-surface border border-border-default rounded-2xl p-8 shadow-sm">
          <h1 className="font-display font-semibold text-2xl text-text-primary mb-1.5 tracking-tight">
            Set new password
          </h1>
          <p className="text-text-muted font-sans text-sm mb-6">
            Must be at least 8 characters with uppercase, number, and special character.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="New Password"
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
              error={errors.newPassword?.message}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="text-text-muted hover:text-text-primary transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register('newPassword')}
            />
            <Input
              label="Confirm Password"
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
              error={errors.confirm?.message}
              {...register('confirm')}
            />

            {apiError && (
              <div className="px-4 py-3 rounded-lg bg-semantic-error/10 border border-semantic-error/25 text-sm text-semantic-error font-sans">
                {apiError}
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={isPending}>
              {isPending ? 'Saving…' : 'Reset Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
