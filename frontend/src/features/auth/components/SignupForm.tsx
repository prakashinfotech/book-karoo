import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { ROUTES } from '@/shared/constants';
import { useSignup } from '../api/useAuth';
import { useCities } from '@/features/cities/api/useCities';
import type { ApiError } from '@/shared/types';

const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters').max(100),
  email:    z.string().email('Invalid email address'),
  mobile:   z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^a-zA-Z0-9]/, 'Must contain a special character'),
  dob:    z.string().min(1, 'Date of birth required'),
  gender: z.string().optional(),
  cityId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const GENDERS = [
  { value: 'Male',             label: 'Male' },
  { value: 'Female',           label: 'Female' },
  { value: 'Other',            label: 'Other' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

function getPasswordStrength(pwd: string): number {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  return score;
}

export function SignupForm() {
  const { mutate: signup, isPending } = useSignup();
  const navigate = useNavigate();
  const { data: cities = [], isLoading: citiesLoading } = useCities();
  const [showPwd, setShowPwd] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const pwd = watch('password') ?? '';
  const watchedGender = watch('gender');
  const strength = getPasswordStrength(pwd);

  const strengthColor =
    strength === 0 ? 'bg-border-default'
    : strength === 4 ? 'bg-green-500'
    : strength >= 2 ? 'bg-yellow-500'
    : 'bg-red-500';
  const strengthLabel =
    strength === 4 ? 'Strong' : strength >= 2 ? 'Fair' : strength >= 1 ? 'Weak' : '';
  const strengthBars = strength === 4 ? 3 : strength >= 2 ? 2 : strength >= 1 ? 1 : 0;

  function onSubmit(data: FormValues) {
    setApiError(null);
    signup(data, {
      onSuccess: () => navigate(ROUTES.HOME, { replace: true }),
      onError: (err: unknown) => {
        const e = err as ApiError;
        const msg = e?.message ?? 'Signup failed. Please try again.';
        if (e?.statusCode === 409) {
          setError('email', { message: msg });
        } else {
          setApiError(msg);
        }
      },
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Full Name" placeholder="Sanjay Makwana" error={errors.name?.message} {...register('name')} />
      <Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
      <Input label="Mobile" type="tel" placeholder="9900000000" maxLength={10} error={errors.mobile?.message} {...register('mobile')} />

      {/* Password with show/hide + strength bar */}
      <div>
        <Input
          label="Password"
          type={showPwd ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Min 8 chars, uppercase, number, symbol"
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
        {pwd && (
          <div className="mt-1.5 px-0.5">
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors duration-300',
                    i <= strengthBars ? strengthColor : 'bg-border-default'
                  )}
                />
              ))}
            </div>
            {strengthLabel && (
              <p className={cn(
                'text-[11px] mt-1 font-sans',
                strength === 4 ? 'text-green-500' : strength >= 2 ? 'text-yellow-500' : 'text-red-500'
              )}>
                {strengthLabel}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Date of Birth */}
      <Input label="Date of Birth" type="date" error={errors.dob?.message} {...register('dob')} />

      {/* Gender chips */}
      <div>
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 font-sans">Gender</p>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <label
              key={g.value}
              className={cn(
                'px-3 py-1.5 rounded-full border text-sm font-sans cursor-pointer transition-colors duration-150 select-none',
                watchedGender === g.value
                  ? 'bg-accent-indigo/15 border-accent-indigo text-accent-indigo'
                  : 'border-border-default text-text-muted hover:border-border-strong hover:text-text-primary'
              )}
            >
              <input type="radio" value={g.value} className="sr-only" {...register('gender')} />
              {g.label}
            </label>
          ))}
        </div>
      </div>

      {/* City */}
      <div>
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5 font-sans">City</p>
        <select
          {...register('cityId')}
          className="w-full px-3.5 py-3 rounded-md bg-bg-surface border border-border-default text-text-primary text-sm font-sans outline-none focus:border-accent-indigo focus:ring-2 focus:ring-accent-indigo/15 transition-all [color-scheme:dark]"
        >
          <option value="">{citiesLoading ? 'Loading…' : 'Select your city'}</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.cityId && <p className="text-xs text-semantic-error font-sans mt-1">{errors.cityId.message}</p>}
      </div>

      {/* API error alert */}
      {apiError && (
        <div className="px-4 py-3 rounded-lg bg-semantic-error/10 border border-semantic-error/25 text-sm text-semantic-error font-sans">
          {apiError}
        </div>
      )}

      <Button type="submit" fullWidth size="lg" loading={isPending} className="mt-2">
        {isPending ? 'Creating account…' : 'Create Account →'}
      </Button>

      <p className="text-center text-sm text-text-muted font-sans">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="text-accent-indigo hover:underline font-medium">
          Sign In
        </Link>
      </p>
    </form>
  );
}
