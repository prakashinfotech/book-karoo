import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { GlassCard } from '@/shared/components/ui/Card';
import { useContactSupport, type ContactSupportRequest } from '../api/useHelp';

const SUBJECT_OPTIONS = [
  'Booking Issue',
  'Payment Problem',
  'Refund Request',
  'Ticket Not Received',
  'Account Issue',
  'App Bug / Technical Issue',
  'General Inquiry',
  'Other',
] as const;

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Enter a valid email address'),
  subject: z.string().min(1, 'Please select a subject'),
  bookingRef: z.string().max(20).optional(),
  message: z.string().min(20, 'Message must be at least 20 characters').max(2000),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface ContactFormProps {
  defaultEmail?: string;
}

export function ContactForm({ defaultEmail = '' }: ContactFormProps) {
  const { mutate, isPending } = useContactSupport();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { email: defaultEmail },
    mode: 'onBlur',
  });

  const messageValue = watch('message') ?? '';

  function onSubmit(values: ContactFormValues) {
    const payload: ContactSupportRequest = {
      name: values.name,
      email: values.email,
      subject: values.subject,
      message: values.message,
      bookingRef: values.bookingRef || undefined,
    };
    mutate(payload, {
      onSuccess: () => setSubmitted(true),
    });
  }

  if (submitted) {
    return (
      <GlassCard className="max-w-xl mx-auto p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h3 className="font-display font-bold text-xl text-text-primary mb-2">
          Message sent!
        </h3>
        <p className="text-sm font-sans text-text-muted mb-6">
          We've received your query and will respond within 24 hours to your email.
        </p>
        <Link
          to="/help"
          className="inline-block px-6 py-2.5 rounded-full bg-accent-crimson text-white text-sm font-semibold font-sans hover:-translate-y-0.5 transition-all"
        >
          Back to Help
        </Link>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="max-w-xl mx-auto p-6 md:p-8">
      <h2 className="font-display font-bold text-xl text-text-primary mb-6">
        Contact Support
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Name */}
        <div>
          <label htmlFor="contact-name" className="block text-sm font-semibold font-sans text-text-secondary mb-1.5">
            Full Name <span className="text-accent-crimson" aria-hidden>*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            {...register('name')}
            className="w-full px-4 py-2.5 rounded-lg bg-bg-surface border border-border-default text-text-primary placeholder-text-muted text-sm font-sans focus:outline-none focus:border-accent-crimson transition-colors"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-semantic-error font-sans">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="contact-email" className="block text-sm font-semibold font-sans text-text-secondary mb-1.5">
            Email Address <span className="text-accent-crimson" aria-hidden>*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register('email')}
            className="w-full px-4 py-2.5 rounded-lg bg-bg-surface border border-border-default text-text-primary placeholder-text-muted text-sm font-sans focus:outline-none focus:border-accent-crimson transition-colors"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-semantic-error font-sans">{errors.email.message}</p>
          )}
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="contact-subject" className="block text-sm font-semibold font-sans text-text-secondary mb-1.5">
            Subject <span className="text-accent-crimson" aria-hidden>*</span>
          </label>
          <select
            id="contact-subject"
            {...register('subject')}
            className="w-full px-4 py-2.5 rounded-lg bg-bg-surface border border-border-default text-text-primary text-sm font-sans focus:outline-none focus:border-accent-crimson transition-colors"
          >
            <option value="">Select a subject…</option>
            {SUBJECT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors.subject && (
            <p className="mt-1 text-xs text-semantic-error font-sans">{errors.subject.message}</p>
          )}
        </div>

        {/* Booking Ref (optional) */}
        <div>
          <label htmlFor="contact-ref" className="block text-sm font-semibold font-sans text-text-secondary mb-1.5">
            Booking Reference <span className="text-text-muted text-xs font-normal">(optional)</span>
          </label>
          <input
            id="contact-ref"
            type="text"
            placeholder="BK-XXXXXXXX"
            {...register('bookingRef')}
            className="w-full px-4 py-2.5 rounded-lg bg-bg-surface border border-border-default text-text-primary placeholder-text-muted text-sm font-mono focus:outline-none focus:border-accent-crimson transition-colors"
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="contact-message" className="block text-sm font-semibold font-sans text-text-secondary mb-1.5">
            Message <span className="text-accent-crimson" aria-hidden>*</span>
          </label>
          <textarea
            id="contact-message"
            rows={5}
            placeholder="Describe your issue in detail…"
            {...register('message')}
            className="w-full px-4 py-2.5 rounded-lg bg-bg-surface border border-border-default text-text-primary placeholder-text-muted text-sm font-sans focus:outline-none focus:border-accent-crimson transition-colors resize-none"
          />
          <div className="flex justify-between mt-1">
            <span>
              {errors.message && (
                <span className="text-xs text-semantic-error font-sans">{errors.message.message}</span>
              )}
            </span>
            <span className={`text-xs font-sans ${messageValue.length > 1900 ? 'text-semantic-warning' : 'text-text-muted'}`}>
              {messageValue.length}/2000
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-crimson-light to-accent-crimson text-white text-sm font-semibold font-sans hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
        >
          {isPending ? 'Sending…' : 'Send Message'}
        </button>
      </form>
    </GlassCard>
  );
}
