import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useMyOrganizerProfile, useUpdateOrganizerProfile } from '../api/useLys';
import { LysLayout } from '../components/LysLayout';

const schema = z.object({
  name:  z.string().min(2, 'Name must be at least 2 characters').max(200),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
});

type FormData = z.infer<typeof schema>;

function VerificationBanner({ isVerified }: { isVerified: boolean }) {
  if (isVerified) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/25">
        <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-green-400 font-semibold text-sm">Account Verified</p>
          <p className="text-green-300/70 text-xs mt-0.5">
            Your organizer account has been verified. Your submitted events will be reviewed and can go live on BookKaroo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25">
      <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-amber-400 font-semibold text-sm">Verification Pending</p>
        <p className="text-amber-300/70 text-xs mt-0.5">
          Your account is pending verification by the BookKaroo team. Events submitted before verification cannot be approved. Verification typically takes 1–2 business days after registration.
        </p>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton height={72} className="rounded-xl" />
      <div className="bg-bg-surface border border-border-default rounded-2xl p-6 space-y-5">
        <Skeleton height={16} className="w-1/4" />
        <Skeleton height={40} className="rounded-lg" />
        <Skeleton height={16} className="w-1/4" />
        <Skeleton height={40} className="rounded-lg" />
        <Skeleton height={16} className="w-1/4" />
        <Skeleton height={40} className="rounded-lg" />
        <Skeleton height={16} className="w-1/4" />
        <Skeleton height={40} className="rounded-lg" />
      </div>
    </div>
  );
}

export function LysProfilePage() {
  const navigate = useNavigate();
  const { data: organizer, isLoading } = useMyOrganizerProfile();
  const update = useUpdateOrganizerProfile();

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '' },
  });

  useEffect(() => {
    if (organizer) {
      reset({ name: organizer.name, phone: organizer.phone });
    }
  }, [organizer, reset]);

  if (isLoading) {
    return (
      <LysLayout>
        <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-2xl mx-auto">
          <h1 className="font-display font-bold text-2xl text-text-primary mb-6">My Profile</h1>
          <ProfileSkeleton />
        </div>
      </LysLayout>
    );
  }

  if (!organizer) {
    return (
      <LysLayout>
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <p className="text-4xl mb-4">🎭</p>
          <h2 className="font-display font-bold text-xl text-text-primary mb-2">No organizer profile found</h2>
          <p className="text-text-muted text-sm mb-6">Register as an organizer to get started.</p>
          <button
            onClick={() => navigate('/list-your-show/register')}
            className="px-6 py-2.5 bg-gradient-to-r from-accent-indigo to-[#7C3AED] text-white font-semibold rounded-full text-sm"
          >
            Register as Organizer
          </button>
        </div>
      </LysLayout>
    );
  }

  async function onSubmit(data: FormData) {
    await update.mutateAsync(data);
  }

  return (
    <LysLayout>
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl text-text-primary mb-6">My Profile</h1>

      <div className="space-y-5">
        <VerificationBanner isVerified={organizer.isVerified} />

        <form onSubmit={handleSubmit(onSubmit)} className="bg-bg-surface border border-border-default rounded-2xl p-6 space-y-5">
          {/* Name — editable */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Full Name</label>
            <input
              {...register('name')}
              className="w-full px-4 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo"
            />
            {errors.name && <p className="text-semantic-error text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Email — read-only */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Email <span className="text-text-muted font-normal text-xs">(cannot be changed)</span>
            </label>
            <input
              value={organizer.email}
              readOnly
              className="w-full px-4 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-muted text-sm opacity-60 cursor-not-allowed"
            />
          </div>

          {/* Phone — editable */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Mobile Number</label>
            <input
              {...register('phone')}
              type="tel"
              maxLength={10}
              className="w-full px-4 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent-indigo"
            />
            {errors.phone && <p className="text-semantic-error text-xs mt-1">{errors.phone.message}</p>}
          </div>

          {/* PAN — read-only */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              PAN Number <span className="text-text-muted font-normal text-xs">(cannot be changed)</span>
            </label>
            <input
              value={organizer.panNumber}
              readOnly
              className="w-full px-4 py-2.5 bg-bg-surface2 border border-border-default rounded-lg text-text-muted text-sm opacity-60 cursor-not-allowed uppercase tracking-widest"
            />
          </div>

          {update.isSuccess && (
            <p className="text-green-400 text-sm flex items-center gap-1.5">
              <CheckCircle size={14} /> Profile updated successfully.
            </p>
          )}

          <button
            type="submit"
            disabled={!isDirty || update.isPending}
            className="w-full py-3 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-semibold rounded-full text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {update.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </form>

        {/* Account info panel */}
        <div className="bg-bg-surface border border-border-default rounded-2xl p-6 space-y-3">
          <h3 className="font-display font-semibold text-text-primary text-sm">Account Details</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-text-muted mb-0.5">Organizer ID</p>
              <p className="text-text-secondary font-mono">{organizer.id.slice(0, 8)}…</p>
            </div>
            <div>
              <p className="text-text-muted mb-0.5">Status</p>
              <p className={organizer.isActive ? 'text-green-400' : 'text-semantic-error'}>
                {organizer.isActive ? 'Active' : 'Deactivated'}
              </p>
            </div>
            <div>
              <p className="text-text-muted mb-0.5">Verification</p>
              <div className="flex items-center gap-1">
                {organizer.isVerified ? (
                  <><CheckCircle size={11} className="text-green-400" /><span className="text-green-400">Verified</span></>
                ) : (
                  <><Clock size={11} className="text-amber-400" /><span className="text-amber-400">Pending</span></>
                )}
              </div>
            </div>
            <div>
              <p className="text-text-muted mb-0.5">Registered</p>
              <p className="text-text-secondary">
                {new Date(organizer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </LysLayout>
  );
}
