import { useNavigate } from 'react-router-dom';
import { useLysCommissionRate } from '../api/useLys';

const STEPS = [
  {
    icon: '📋',
    title: 'Create your event',
    body: 'Fill in your event details — title, date, venue, and ticket pricing. Add a poster image and artist lineup.',
  },
  {
    icon: '✅',
    title: 'Get approved',
    body: 'Our team reviews your submission within 2 business days. We may ask for changes if needed.',
  },
  {
    icon: '🎟',
    title: 'Start selling',
    body: 'Once approved, your event goes live on BookKaroo immediately. Customers can book tickets right away.',
  },
] as const;

const BENEFITS = [
  { icon: '🌍', title: 'Reach across 25 Indian cities' },
  { icon: '💳', title: 'Multiple payment methods — UPI, Cards, Net Banking' },
  { icon: '📧', title: 'Automatic confirmation emails and QR tickets' },
  { icon: '📊', title: 'Real-time sales dashboard' },
  { icon: '📄', title: 'Downloadable attendee list (Phase 2)' },
  { icon: '💰', title: 'Transparent payouts (Phase 2)' },
] as const;

const FAQS = [
  {
    q: 'Is there a cost to list my event?',
    a: 'Listing is free. BookKaroo takes a commission on each ticket sold.',
  },
  {
    q: 'How long does approval take?',
    a: 'Our team reviews submissions within 2 business days. We may ask for changes if the listing is incomplete.',
  },
  {
    q: 'Can I cancel or modify my event after approval?',
    a: 'Contact our support team. Refunds to customers are handled automatically by BookKaroo.',
  },
  {
    q: 'What events are NOT allowed?',
    a: 'Political rallies, events promoting illegal activities, events without a confirmed venue, or events fewer than 7 days away.',
  },
  {
    q: 'How does payment work?',
    a: 'Customers pay through BookKaroo. Payouts to organizers will be available in a future update.',
  },
] as const;

export function LysLandingPage() {
  const navigate = useNavigate();
  const { data: commissionData } = useLysCommissionRate();
  const rate = commissionData?.rate ?? 5;

  return (
    <div className="min-h-screen bg-bg-base font-sans">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1333] via-[#0A0E1A] to-[#0f1a2e] px-6 py-24 text-center">
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-accent-indigo font-semibold text-sm uppercase tracking-widest mb-4">
            ListYourShow on BookKaroo
          </p>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-text-primary mb-6 leading-tight">
            List Your Show on BookKaroo
          </h1>
          <p className="text-text-secondary text-lg mb-10 max-w-xl mx-auto">
            Reach millions of entertainment fans across India. Set up your event in minutes, sell tickets instantly.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate('/list-your-show/register')}
              className="px-8 py-3.5 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-semibold rounded-full text-sm hover:opacity-90 transition-opacity"
            >
              Get Started Free
            </button>
            <a
              href="#how-it-works"
              className="px-8 py-3.5 border border-border-default text-text-secondary font-semibold rounded-full text-sm hover:border-border-strong hover:text-text-primary transition-colors"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-20 max-w-5xl mx-auto">
        <h2 className="font-display font-bold text-2xl text-text-primary text-center mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <span className="text-5xl mb-4">{step.icon}</span>
              <div className="w-8 h-8 rounded-full bg-accent-indigo/20 text-accent-indigo flex items-center justify-center text-sm font-bold mb-4">
                {i + 1}
              </div>
              <h3 className="font-display font-semibold text-lg text-text-primary mb-2">{step.title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Commission info */}
      <section className="px-6 py-10 bg-bg-surface">
        <div className="max-w-3xl mx-auto border border-accent-indigo/25 rounded-2xl bg-accent-indigo/5 p-8 text-center">
          <p className="text-text-primary font-semibold text-lg mb-2">
            BookKaroo takes a <span className="text-accent-indigo">{rate}% commission</span> per ticket sold.
          </p>
          <p className="text-text-muted text-sm">
            No hidden fees. No setup charges. You only pay when you earn.
          </p>
          <p className="text-text-muted text-xs mt-2">
            Example: For a ₹500 ticket, BookKaroo earns ₹{(500 * rate / 100).toFixed(0)} and you receive ₹{(500 - 500 * rate / 100).toFixed(0)} (Phase 2 payout).
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <h2 className="font-display font-bold text-2xl text-text-primary text-center mb-12">
          What You Get
        </h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {BENEFITS.map((b, i) => (
            <div key={i} className="bg-bg-surface2 rounded-xl p-5 border border-border-default">
              <span className="text-2xl mb-3 block">{b.icon}</span>
              <p className="text-text-secondary text-sm leading-relaxed">{b.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 bg-bg-surface">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-bold text-2xl text-text-primary text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <details key={i} className="border border-border-default rounded-xl group">
                <summary className="px-5 py-4 cursor-pointer font-semibold text-text-primary text-sm list-none flex justify-between items-center">
                  {faq.q}
                  <span className="text-text-muted ml-4 flex-shrink-0 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-5 pb-4 text-text-muted text-sm leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-6 py-20 text-center bg-gradient-to-b from-bg-base to-bg-surface">
        <h2 className="font-display font-bold text-2xl text-text-primary mb-6">
          Ready to list your show?
        </h2>
        <button
          onClick={() => navigate('/list-your-show/register')}
          className="px-8 py-3.5 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white font-semibold rounded-full text-sm hover:opacity-90 transition-opacity"
        >
          Create Your Event
        </button>
      </section>
    </div>
  );
}
