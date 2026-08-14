import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { ROUTES } from '@/shared/constants';
import { useLogin } from '../api/useAuth';
import type { ApiError } from '@/shared/types';

const schema = z.object({
  identifier: z.string().min(1, 'Email or mobile is required'),
  password:   z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const { mutate: login, isPending } = useLogin();
  const navigate  = useNavigate();
  const location  = useLocation();
  const returnTo  = (location.state as { returnTo?: string } | null)?.returnTo ?? ROUTES.HOME;

  const [showPwd, setShowPwd] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  function onSubmit(data: FormValues) {
    setApiError(null);
    login(data, {
      onSuccess: () => navigate(returnTo, { replace: true }),
      onError: (err: unknown) => {
        const e = err as ApiError;
        setApiError(e?.message ?? 'Invalid credentials.');
      },
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Email or Mobile"
        autoComplete="username"
        placeholder="Email or 10-digit mobile"
        error={errors.identifier?.message}
        {...register('identifier')}
      />

      <div>
        <Input
          label="Password"
          type={showPwd ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Your password"
          error={errors.password?.message}
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
          {...register('password')}
        />
        <div className="flex justify-end mt-1">
          <Link to={ROUTES.FORGOT_PASSWORD} className="text-xs text-accent-indigo hover:underline font-sans">
            Forgot password?
          </Link>
        </div>
      </div>

      {apiError && (
        <div className="px-4 py-3 rounded-lg bg-semantic-error/10 border border-semantic-error/25 text-sm text-semantic-error font-sans">
          {apiError}
        </div>
      )}

      <Button type="submit" fullWidth size="lg" loading={isPending}>
        {isPending ? 'Signing in…' : 'Sign In →'}
      </Button>

      <p className="text-center text-sm text-text-muted font-sans">
        New to BookKaroo?{' '}
        <Link to={ROUTES.SIGNUP} className="text-accent-indigo hover:underline font-medium">
          Create account
        </Link>
      </p>
    </form>
  );
}
