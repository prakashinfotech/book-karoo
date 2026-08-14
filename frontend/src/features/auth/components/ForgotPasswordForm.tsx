import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { ROUTES } from '@/shared/constants';
import { useForgotPassword } from '../api/useAuth';

const schema = z.object({ email: z.string().email('Invalid email address') });
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const { mutate: forgotPassword, isPending } = useForgotPassword();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  function onSubmit({ email }: FormValues) {
    forgotPassword(email, {
      onSuccess: () => setSubmittedEmail(email),
    });
  }

  if (submittedEmail) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-14 h-14 rounded-full bg-accent-indigo/10 border border-accent-indigo/20 flex items-center justify-center mx-auto">
          <Mail size={28} className="text-accent-indigo" />
        </div>
        <h2 className="font-display font-semibold text-xl text-text-primary">Check your inbox</h2>
        <p className="text-sm text-text-muted font-sans leading-relaxed">
          If <span className="text-text-primary font-medium">{submittedEmail}</span> is registered,
          you'll receive a reset link shortly.
        </p>
        <p className="text-xs text-text-muted font-sans">
          Didn't get it? Check your spam folder.
        </p>
        <Link
          to={ROUTES.LOGIN}
          className="inline-block mt-2 text-sm text-accent-indigo hover:underline font-sans font-medium"
        >
          ← Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <Button type="submit" fullWidth size="lg" loading={isPending}>
        {isPending ? 'Sending…' : 'Send Reset Link'}
      </Button>
      <p className="text-center text-sm font-sans">
        <Link to={ROUTES.LOGIN} className="text-accent-indigo hover:underline">
          ← Back to Sign In
        </Link>
      </p>
    </form>
  );
}
