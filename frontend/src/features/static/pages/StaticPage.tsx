import { useParams } from 'react-router-dom';
import { PublicLayout } from '@/shared/components/layout/PublicLayout';

interface PageContent { title: string; emoji: string; body: React.ReactNode; }

const PAGES: Record<string, PageContent> = {
  about: {
    title: 'About BookKaroo',
    emoji: '🎬',
    body: (
      <div className="prose-sm space-y-4 text-text-secondary font-sans leading-relaxed">
        <p>BookKaroo is India's premium entertainment ticket booking platform — a BookMyShow-style service built for the modern Indian audience.</p>
        <p>We support booking for <strong className="text-text-primary">movies, live events, concerts, plays, sports, activities, and TATA IPL 2026</strong> across 25 Indian cities.</p>
        <p>Our mission is to make entertainment access frictionless — fast seat selection, instant e-tickets, GST-compliant invoices, and a cinematic-quality digital experience.</p>
        <h3 className="text-text-primary font-semibold mt-6">Contact Us</h3>
        <p>Email: <a href="mailto:support@bookkaroo.com" className="text-accent-indigo">support@bookkaroo.com</a></p>
        <p>Address: 701, Demo Tower, SG Highway, Bodakdev, Ahmedabad, Gujarat 380054</p>
        <p className="text-xs text-text-muted mt-6">© 2026 BookKaroo Pvt Ltd · GSTIN: 24XXXXX0000X1Z5 (demo placeholder)</p>
      </div>
    ),
  },
  careers: {
    title: 'Careers at BookKaroo',
    emoji: '🚀',
    body: (
      <div className="space-y-4 text-text-secondary font-sans text-sm leading-relaxed">
        <p>We're building the future of entertainment access in India. We're looking for passionate engineers, designers, and product thinkers.</p>
        <p>Send your resume to <a href="mailto:careers@bookkaroo.com" className="text-accent-indigo underline">careers@bookkaroo.com</a></p>
        <div className="p-4 rounded-xl bg-bg-surface2 border border-border-default mt-6">
          <p className="font-semibold text-text-primary mb-2">Open Positions</p>
          <p className="text-text-muted text-sm">No open positions at the moment. Check back soon!</p>
        </div>
      </div>
    ),
  },
  'list-your-show': {
    title: 'List Your Show',
    emoji: '🎭',
    body: (
      <div className="space-y-4 text-text-secondary font-sans text-sm leading-relaxed">
        <p>Are you an event organiser, cinema owner, or sports venue? List your shows on BookKaroo and reach millions of entertainment seekers.</p>
        <p>Email us at <a href="mailto:partners@bookkaroo.com" className="text-accent-indigo underline">partners@bookkaroo.com</a> to get started.</p>
        <p>We support movies, live events, sports, plays, activities, and workshops.</p>
      </div>
    ),
  },
  blog: {
    title: 'BookKaroo Blog',
    emoji: '📝',
    body: (
      <div className="space-y-4 text-text-secondary font-sans text-sm">
        <p>Stories, guides, and behind-the-scenes from the world of Indian entertainment.</p>
        <p className="text-text-muted">Blog posts coming soon!</p>
      </div>
    ),
  },
  'terms': {
    title: 'Terms & Conditions',
    emoji: '📄',
    body: (
      <div className="space-y-4 text-text-secondary font-sans text-sm leading-relaxed">
        <p className="text-text-muted text-xs">Last updated: 9 May 2026</p>
        <h3 className="font-semibold text-text-primary">1. Booking & Payment</h3>
        <p>All ticket purchases are final. Convenience fees (₹59/ticket + 18% GST) are non-refundable. Ticket amounts are refundable subject to the cancellation policy.</p>
        <h3 className="font-semibold text-text-primary">2. Cancellation Policy</h3>
        <p>Cancellations are allowed up to 2 hours before showtime. Refunds are processed within 7 business days to the original payment method. Convenience fees are non-refundable.</p>
        <h3 className="font-semibold text-text-primary">3. Use of Service</h3>
        <p>BookKaroo is for personal use only. Reselling tickets is prohibited and will result in account termination.</p>
        <h3 className="font-semibold text-text-primary">4. GST</h3>
        <p>GST is charged at 18% on convenience fees only. Ticket amounts belong to the venue/organiser and are not subject to BookKaroo's GST. Company GSTIN: 24XXXXX0000X1Z5 (placeholder).</p>
        <p className="text-xs text-text-muted mt-6">For queries, contact support@bookkaroo.com</p>
      </div>
    ),
  },
  'privacy': {
    title: 'Privacy Policy',
    emoji: '🔒',
    body: (
      <div className="space-y-4 text-text-secondary font-sans text-sm leading-relaxed">
        <p className="text-text-muted text-xs">Last updated: 9 May 2026</p>
        <h3 className="font-semibold text-text-primary">Data We Collect</h3>
        <p>Name, email, mobile number, city, date of birth, and booking history. We never store full card numbers.</p>
        <h3 className="font-semibold text-text-primary">How We Use It</h3>
        <p>To process bookings, send e-tickets, generate GST invoices, and improve our service. We do not sell your data.</p>
        <h3 className="font-semibold text-text-primary">Third Parties</h3>
        <p>Payment processing (Razorpay sandbox), email delivery (Resend), and movie metadata (TMDB) are our service providers. They operate under their own privacy policies.</p>
        <h3 className="font-semibold text-text-primary">Your Rights</h3>
        <p>You can request data deletion by emailing support@bookkaroo.com. We comply with Indian data protection regulations.</p>
      </div>
    ),
  },
  'faq': {
    title: 'FAQ',
    emoji: '❓',
    body: <p className="text-text-secondary font-sans text-sm">Redirecting to Help Centre…</p>,
  },
  'sitemap': {
    title: 'Sitemap',
    emoji: '🗺️',
    body: (
      <div className="space-y-2 text-sm font-sans">
        {[
          ['Home', '/'],
          ['Movies', '/movies'],
          ['Events', '/events'],
          ['Sports', '/sports'],
          ['Plays', '/plays'],
          ['IPL 2026', '/ipl'],
          ['Search', '/search'],
          ['My Bookings', '/profile/bookings'],
          ['Help Centre', '/help'],
        ].map(([label, href]) => (
          <div key={href}><a href={href} className="text-accent-indigo hover:underline">{label}</a></div>
        ))}
      </div>
    ),
  },
};

export default function StaticPage() {
  const { slug = 'about' } = useParams<{ slug: string }>();
  const page = PAGES[slug];

  if (!page) return (
    <PublicLayout>
      <div className="max-w-[760px] mx-auto px-6 py-16 text-center">
        <p className="text-4xl mb-4">404</p>
        <p className="text-text-muted font-sans">Page not found.</p>
      </div>
    </PublicLayout>
  );

  return (
    <PublicLayout>
      <div className="max-w-[760px] mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{page.emoji}</span>
          <h1 className="font-display font-bold text-3xl tracking-tight">{page.title}</h1>
        </div>
        <div className="p-7 rounded-2xl bg-bg-surface border border-border-default">
          {page.body}
        </div>
      </div>
    </PublicLayout>
  );
}
