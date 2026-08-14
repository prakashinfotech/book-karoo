import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { X, ArrowLeft } from 'lucide-react';
import { useCheckoutStore } from '@/shared/store/checkoutStore';
import { useBookingDetail, downloadInvoicePdf } from '../api/useBooking';
import { ROUTES, TMDB_POSTER } from '@/shared/constants';
import { formatCurrency } from '@/shared/lib/utils';

// ── Confetti ──────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  '#E11D74', '#6366F1', '#A855F7', '#F59E0B', '#10B981',
  '#EC4899', '#3B82F6', '#14B8A6', '#E11D74', '#6366F1',
  '#A855F7', '#F59E0B',
];

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {CONFETTI_COLORS.map((color, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            background: color,
            left: `${5 + (i * 8) % 90}%`,
            top: '-8px',
            animation: `confettiFall 1.6s ${i * 0.11}s ease-out forwards`,
          }}
        />
      ))}
    </div>
  );
}

// ── Ticket card notch cutout ───────────────────────────────────────────────────

function TicketNotch({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      className="absolute w-6 h-6 rounded-full bg-bg-base z-10"
      style={{ top: 'calc(45% - 12px)', [side]: '-12px' }}
    />
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { bookingDetail, orderResponse, contactEmail, clearAll } = useCheckoutStore();
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [stampDone, setStampDone] = useState(false);

  // ref comes from store OR from URL ?ref= param (email link)
  const urlRef = searchParams.get('ref') ?? '';
  const ref = bookingDetail?.bookingRef ?? orderResponse?.bookingRef ?? urlRef;

  // Fetch from API when arriving from email link (store is empty, ref in URL)
  const { data: fetched } = useBookingDetail(!bookingDetail && ref ? ref : '');
  const detail = bookingDetail ?? fetched ?? null;

  useEffect(() => {
    // Delay the guard so the Zustand store (persisted in sessionStorage) has
    // time to settle after navigation from CheckoutPage.
    const t = setTimeout(() => {
      if (!bookingDetail && !orderResponse && !urlRef) {
        navigate('/');
      }
    }, 300);
    return () => clearTimeout(t);
  }, [bookingDetail, orderResponse, urlRef]);

  useEffect(() => {
    const t = setTimeout(() => setStampDone(true), 1300);
    return () => clearTimeout(t);
  }, []);

  // ── Download invoice (on-demand PDF from API) ─────────────────────────────
  async function handleDownloadInvoice() {
    if (!ref) return;
    setInvoiceLoading(true);
    try {
      await downloadInvoicePdf(ref);
    } finally {
      setInvoiceLoading(false);
    }
  }

  // ── Calendar ICS ──────────────────────────────────────────────────────────
  function handleAddToCalendar() {
    if (!detail) return;
    const { date, time, venueName, city, screenName } = detail.show;
    const dtStr = `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
    const seats = detail.seats.map(s => s.label).join(', ');
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${dtStr}`,
      `SUMMARY:🎬 ${detail.movie.title} at ${venueName}`,
      `DESCRIPTION:Booking: ${detail.bookingRef}\\nSeats: ${seats}\\nScreen: ${screenName}`,
      `LOCATION:${venueName}\\, ${city}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${detail.bookingRef}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── WhatsApp share ────────────────────────────────────────────────────────
  function handleWhatsApp() {
    if (!detail) return;
    const msg = [
      '🎬 *BookKaroo Booking Confirmed!*',
      '',
      `*Movie:* ${detail.movie.title}`,
      `*Date:* ${detail.show.date}`,
      `*Time:* ${detail.show.time}`,
      `*Venue:* ${detail.show.venueName}`,
      `*Seats:* ${detail.seats.map(s => s.label).join(', ')}`,
      `*Booking ID:* ${detail.bookingRef}`,
    ].join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  }

  function handleDone() {
    clearAll();
    navigate(ROUTES.HOME);
  }

  const pricing      = detail?.pricing;
  // Event booking: seats array is empty and screenName holds tier name
  const isEventBooking = detail && detail.seats.length === 0 && !!detail.show.screenName;

  const containerVariants = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(540px) rotate(720deg); opacity: 0; }
        }
        @keyframes stampIn {
          0%   { transform: scale(2) rotate(-20deg); opacity: 0; }
          70%  { transform: scale(0.95) rotate(-15deg); opacity: 1; }
          100% { transform: scale(1) rotate(-15deg); opacity: 1; }
        }
      `}</style>

      <Helmet><title>Booking Confirmed | BookKaroo</title></Helmet>
      <div className="min-h-screen bg-bg-base text-text-primary font-sans pb-16 overflow-x-hidden">

        {/* ── Top bar with close button ── */}
        <div className="sticky top-0 z-50 bg-bg-base/95 backdrop-blur-sm border-b border-border-default px-4 py-3 flex items-center justify-between max-w-[480px] mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-medium font-sans text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-bg-surface2 border border-border-default text-text-muted hover:text-text-primary hover:border-border-strong transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <motion.div
          className="max-w-[480px] mx-auto px-4 pt-6 relative"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Confetti */}
          <div className="relative h-0"><Confetti /></div>

          {/* ── Hero ── */}
          <motion.div className="flex flex-col items-center mb-8" variants={itemVariants}>
            <motion.div
              className="w-20 h-20 rounded-full bg-semantic-success/20 border-[3px] border-semantic-success flex items-center justify-center text-4xl text-semantic-success mb-5"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.15, 1] }}
              transition={{ duration: 0.5, times: [0, 0.7, 1] }}
            >
              ✓
            </motion.div>

            <div className="font-display font-bold text-xl mb-4">
              <span className="text-text-primary">Book</span>
              <span className="text-accent-crimson">Karoo</span>
            </div>

            <h1 className="font-display font-black text-3xl text-semantic-success text-center leading-tight mb-3">
              Booking Confirmed!
            </h1>

            <div className="px-4 py-1.5 rounded-full bg-bg-surface2 border border-border-default font-mono text-sm text-text-primary tracking-widest">
              {ref || '…'}
            </div>

            {contactEmail && (
              <p className="text-[11px] text-text-muted font-sans mt-2 text-center">
                Confirmation & invoice sent to {contactEmail}
              </p>
            )}
          </motion.div>

          {/* ── Ticket card ── */}
          <motion.div variants={itemVariants} className="mb-5">
            <div
              className="relative rounded-[20px] overflow-visible border border-border-default"
              style={{
                background: 'linear-gradient(135deg, #16213e, #1a1a2e)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              }}
            >
              <TicketNotch side="left" />
              <TicketNotch side="right" />

              {/* Dashed tear line */}
              <div
                className="absolute left-4 right-4 border-t-2 border-dashed border-border-default"
                style={{ top: '45%' }}
              />

              {/* Top half */}
              <div className="rounded-t-[20px] overflow-hidden p-6 pb-8">
                <div className="flex gap-4">
                  {/* Poster */}
                  <div className="w-[68px] flex-shrink-0 aspect-[2/3] rounded-lg overflow-hidden bg-bg-surface2">
                    {detail?.movie.posterUrl
                      ? <img src={TMDB_POSTER(detail.movie.posterUrl, 'w185')} alt={detail.movie.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gradient-to-br from-accent-indigo/40 to-accent-purple/40 flex items-center justify-center text-2xl">🎬</div>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-display font-black text-base text-white leading-tight mb-1 line-clamp-2">
                      {detail?.movie.title ?? (isEventBooking ? 'Event Ticket' : 'Movie Ticket')}
                    </p>
                    <p className="text-[12px] text-white/75 font-sans">
                      {detail?.show.date} · {detail?.show.time}
                    </p>
                    <p className="text-[12px] text-white/55 font-sans mt-0.5 leading-snug line-clamp-2">
                      {detail?.show.venueName}
                    </p>
                    {isEventBooking ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-accent-indigo/20 border border-accent-indigo/30 text-[10px] font-mono text-[#A5B4FC] uppercase">
                          {detail?.show.screenName}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-[10px] font-mono text-white/70 uppercase">
                          {detail?.show.screenName ?? 'SCREEN'}
                        </span>
                        {detail?.seats.map(s => (
                          <span key={s.label} className="px-1.5 py-0.5 rounded bg-accent-indigo/20 border border-accent-indigo/30 text-[10px] font-mono text-[#A5B4FC] uppercase">
                            {s.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stamp — always rendered, CSS animation fires once */}
                <div
                  className="absolute top-4 right-4 text-center select-none"
                  style={{
                    border: '2px solid #E11D74',
                    borderRadius: 6,
                    padding: '3px 8px',
                    color: '#E11D74',
                    transform: 'rotate(-15deg)',
                    animation: stampDone ? 'none' : 'stampIn 0.5s 0.8s cubic-bezier(0.34,1.56,0.64,1) both',
                  }}
                >
                  <div className="text-[8px] font-black tracking-widest leading-tight">BOOKING</div>
                  <div className="text-[8px] font-black tracking-widest leading-tight">CONFIRMED</div>
                </div>
              </div>

              {/* Bottom half — QR code */}
              <div className="flex flex-col items-center px-6 pt-8 pb-6">
                {ref ? (
                  <div className="bg-white p-3 rounded-xl">
                    <QRCodeSVG
                      value={ref}
                      size={140}
                      level="Q"
                      includeMargin={false}
                    />
                  </div>
                ) : (
                  <div className="w-[164px] h-[164px] rounded-xl bg-bg-surface2 animate-pulse" />
                )}
                <p className="text-[10px] text-white/45 font-sans tracking-widest uppercase mt-3">
                  Scan at entry counter
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── Action buttons ── */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2 mb-5">
            <button
              onClick={handleDownloadInvoice}
              disabled={invoiceLoading || !ref}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-bg-surface border border-border-default text-center hover:border-border-strong transition-colors disabled:opacity-40"
            >
              <span className="text-xl">{invoiceLoading ? '⏳' : '📄'}</span>
              <span className="text-[10px] font-sans text-text-secondary leading-tight">
                {invoiceLoading ? 'Generating…' : 'Download\nInvoice'}
              </span>
            </button>

            <button
              onClick={handleAddToCalendar}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-bg-surface border border-border-default text-center hover:border-border-strong transition-colors"
            >
              <span className="text-xl">📅</span>
              <span className="text-[10px] font-sans text-text-secondary leading-tight">Add to{'\n'}Calendar</span>
            </button>

            <button
              onClick={handleWhatsApp}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-bg-surface border border-border-default text-center hover:border-border-strong transition-colors"
            >
              <span className="text-xl">💬</span>
              <span className="text-[10px] font-sans text-text-secondary leading-tight">Share on{'\n'}WhatsApp</span>
            </button>
          </motion.div>

          {/* ── Order summary ── */}
          {pricing && (
            <motion.div variants={itemVariants} className="mb-5 p-5 rounded-xl bg-bg-surface border border-border-default">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold font-sans text-text-primary">Amount Paid</span>
                <span className="font-display font-bold text-2xl text-accent-crimson">
                  {formatCurrency(pricing.amountPaid)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div>
                  <p className="text-[10px] text-text-muted font-sans uppercase tracking-wider mb-1">Booked</p>
                  <p className="text-xs font-sans text-text-secondary">
                    {detail?.createdAt
                      ? new Date(detail.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-sans uppercase tracking-wider mb-1">Payment</p>
                  <p className="text-xs font-sans text-text-secondary">{detail?.payment.method ?? 'Mock'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted font-sans uppercase tracking-wider mb-1">Ref #</p>
                  <p className="text-xs font-mono text-text-secondary">{ref.slice(-6)}</p>
                </div>
              </div>

              <div className="border-t border-border-default pt-4 space-y-2">
                <div className="flex justify-between text-sm font-sans">
                  <span className="text-text-muted">Ticket Amount</span>
                  <span className="text-text-secondary">{formatCurrency(pricing.ticketAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-sans">
                  <span className="text-text-muted">Convenience Fee + GST</span>
                  <span className="text-text-secondary">
                    {formatCurrency(pricing.convenienceFee + pricing.convenienceFeeGst)}
                  </span>
                </div>
                {pricing.offerProcessingFee > 0 && (
                  <div className="flex justify-between text-sm font-sans">
                    <span className="text-text-muted">Offer Processing Fee + GST</span>
                    <span className="text-text-secondary">
                      {formatCurrency(pricing.offerProcessingFee + pricing.offerProcessingFeeGst)}
                    </span>
                  </div>
                )}
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-sm font-sans">
                    <span className="text-semantic-success">Discount</span>
                    <span className="text-semantic-success">-{formatCurrency(pricing.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-sans font-semibold pt-1 border-t border-border-default">
                  <span className="text-text-primary">Total Paid</span>
                  <span className="text-accent-crimson">{formatCurrency(pricing.amountPaid)}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Invoice number ── */}
          {detail?.invoiceNumber && (
            <motion.div variants={itemVariants} className="mb-5 px-4 py-3 rounded-lg bg-bg-surface2 border border-border-default flex justify-between items-center">
              <span className="text-[11px] text-text-muted font-sans uppercase tracking-wider">Invoice No.</span>
              <span className="text-xs font-mono text-text-secondary">{detail.invoiceNumber}</span>
            </motion.div>
          )}

          {/* ── Important instructions ── */}
          <motion.div variants={itemVariants} className="mb-5 p-5 rounded-xl bg-bg-surface border border-border-default">
            <p className="text-[11px] text-text-muted font-sans uppercase tracking-widest mb-3">Important Instructions</p>
            <ul className="space-y-2 text-sm text-text-secondary font-sans list-disc list-inside leading-relaxed">
              <li>Carry a valid government-issued photo ID — checked at the venue.</li>
              <li>Cancellation allowed if show is more than 2 hours away. Convenience fee non-refundable.</li>
              <li>Outside food and beverages not allowed inside the venue.</li>
              <li>Show QR code at the entry counter.</li>
            </ul>
            <p className="text-sm text-text-muted font-sans mt-4">
              Need help with this booking?{' '}
              <Link to="/help#contact-section" className="text-accent-crimson hover:underline">
                Contact Support →
              </Link>
            </p>
          </motion.div>

          {/* ── CTAs ── */}
          <motion.div variants={itemVariants} className="flex flex-col gap-3">
            <Link to={ROUTES.MY_BOOKINGS} className="w-full">
              <button
                className="w-full py-3.5 rounded-xl text-white text-sm font-semibold font-sans hover:-translate-y-0.5 transition-all"
                style={{ background: '#E11D74', boxShadow: '0 8px 24px -8px rgba(225, 29, 116,0.45)' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#B0165D')}
                onMouseLeave={e => (e.currentTarget.style.background = '#E11D74')}
              >
                View My Bookings →
              </button>
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="w-full py-3 rounded-xl border border-border-default bg-bg-surface text-sm font-semibold font-sans text-text-secondary hover:border-border-strong hover:text-text-primary transition-colors"
            >
              ← Go Back
            </button>
            <button
              onClick={handleDone}
              className="w-full py-2.5 text-sm font-sans text-text-muted hover:text-text-secondary transition-colors"
            >
              Go to Home
            </button>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
