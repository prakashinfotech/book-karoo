import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useMyOrganizerProfile, useRegisterOrganizer } from '../api/useLys';
import type { RegisterOrganizerForm } from '../types';

const schema = z.object({
  name:      z.string().min(2, 'Name must be at least 2 characters').max(200),
  email:     z.string().email('Enter a valid email address'),
  phone:     z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  panNumber: z.string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g. ABCDE1234F)')
    .transform((v) => v.toUpperCase()),
});

type FormData = z.infer<typeof schema>;

export function LysRegisterPage() {
  const navigate    = useNavigate();
  const { user, isAuthenticated, isInitialized } = useAuthStore();
  const { data: profile, isLoading: profileLoading } = useMyOrganizerProfile();
  const register    = useRegisterOrganizer();

  const { register: reg, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: user?.email ?? '', phone: '', panNumber: '' },
  });

  useEffect(() => {
    if (user?.email) setValue('email', user.email);
  }, [user?.email, setValue]);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    if (profile) navigate('/list-your-show/my-events', { replace: true });
  }, [isInitialized, isAuthenticated, profile, navigate]);

  if (!isInitialized || profileLoading) return null;

  async function onSubmit(data: FormData) {
    await register.mutateAsync(data as RegisterOrganizerForm);
    navigate('/list-your-show/my-events');
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display font-bold text-2xl text-text-primary mb-2">
            Create Your Organizer Account
          </h1>
          <p className="text-text-muted text-sm">You only need to do this once.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-bg-surface border border-border-default rounded-2xl p-6 space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Full Name</label>
            <input
              {...reg('name')}
              placeholder="Your full name"
              className="w-full px-4 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo"
            />
            {errors.name && <p className="text-semantic-error text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Email</label>
            <input
              {...reg('email')}
              type="email"
              readOnly={!!user?.email}
              className="w-full px-4 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo read-only:opacity-60 read-only:cursor-not-allowed"
            />
            {errors.email && <p className="text-semantic-error text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Mobile Number</label>
            <input
              {...reg('phone')}
              type="tel"
              placeholder="10-digit Indian mobile"
              maxLength={10}
              className="w-full px-4 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo"
            />
            {errors.phone && <p className="text-semantic-error text-xs mt-1">{errors.phone.message}</p>}
          </div>

          {/* PAN */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">PAN Number</label>
            <input
              {...reg('panNumber')}
              placeholder="ABCDE1234F"
              maxLength={10}
              className="w-full px-4 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo uppercase"
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                reg('panNumber').onChange(e);
              }}
            />
            <p className="text-text-muted text-xs mt-1">Required for tax compliance. Format: ABCDE1234F</p>
            {errors.panNumber && <p className="text-semantic-error text-xs mt-1">{errors.panNumber.message}</p>}
          </div>

          <button
            type="submit"
            disabled={register.isPending}
            className="w-full py-3 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-semibold rounded-full text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {register.isPending ? 'Creating account…' : 'Create Organizer Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
