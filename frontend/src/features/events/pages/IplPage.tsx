import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/shared/components/layout/PublicLayout';
import { Button } from '@/shared/components/ui/Button';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useUpcomingEvents } from '../api/useEvents';
import { ROUTES } from '@/shared/constants';

const TEAMS = [
  { abbr: 'GT',   name: 'Gujarat Titans',       color: '#1B64A7', textColor: '#fff' },
  { abbr: 'MI',   name: 'Mumbai Indians',        color: '#004BA0', textColor: '#fff' },
  { abbr: 'RCB',  name: 'Royal Challengers',     color: '#C41C1C', textColor: '#fff' },
  { abbr: 'CSK',  name: 'Chennai Super Kings',   color: '#F9CD1B', textColor: '#000' },
  { abbr: 'RR',   name: 'Rajasthan Royals',      color: '#254AA5', textColor: '#fff' },
  { abbr: 'KKR',  name: 'Kolkata Knight Riders', color: '#3B215C', textColor: '#fff' },
  { abbr: 'SRH',  name: 'Sunrisers Hyderabad',   color: '#D9480F', textColor: '#fff' },
  { abbr: 'DC',   name: 'Delhi Capitals',        color: '#0078C4', textColor: '#fff' },
  { abbr: 'LSG',  name: 'Lucknow Super Giants',  color: '#A72056', textColor: '#fff' },
  { abbr: 'PBKS', name: 'Punjab Kings',          color: '#D71920', textColor: '#fff' },
];

function useCountdown(targetDate: string | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();

    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days:    Math.floor(diff / 86_400_000),
        hours:   Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1000),
      });
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

export default function IplPage() {
  const { data: iplMatches, isLoading } = useUpcomingEvents('ipl', null, 10);
  const nextMatch = iplMatches?.[0] ?? null;
  const countdown = useCountdown(nextMatch?.eventDate ?? null);

  return (
    <PublicLayout>
      {/* Hero */}
      <div
        className="relative overflow-hidden min-h-[400px] flex items-center"
        style={{
          background: 'radial-gradient(60% 100% at 100% 50%, rgba(245,197,107,0.2), transparent), linear-gradient(135deg, #1a0a05 0%, #2d0a0e 50%, #1a0535 100%)',
        }}
      >
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-12 md:py-16 w-full">
          <p className="font-mono text-[11px] tracking-widest uppercase text-[#F5C56B] mb-3">
            ◆ TATA IPL 2026 · Indian Premier League
          </p>
          <h1 className="font-display font-bold text-4xl md:text-6xl text-white mb-4 tracking-tight">
            Cricket.<br />Passion.<br /><span style={{ color: '#F5C56B' }}>Live.</span>
          </h1>
          <p className="text-white/70 font-sans max-w-md mb-8">
            Book seats for TATA IPL 2026 — Narendra Modi Stadium, Wankhede, Eden Gardens and more iconic venues.
          </p>
          <Link to={ROUTES.SPORTS}>
            <Button
              size="lg"
              style={{ background: 'linear-gradient(135deg, #F5C56B, #D4A017)', color: '#1a0a05', boxShadow: '0 8px 24px rgba(245,197,107,0.4)' }}
            >
              🏏 Browse All Matches
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-12">
        {/* Countdown to next match */}
        {nextMatch && (
          <section className="mb-14">
            <p className="text-[11px] font-semibold tracking-widest uppercase font-sans mb-2" style={{ color: '#F5C56B' }}>
              Next Match In
            </p>
            <div className="flex gap-3 flex-wrap">
              {[
                { label: 'Days',    value: countdown.days },
                { label: 'Hours',   value: countdown.hours },
                { label: 'Minutes', value: countdown.minutes },
                { label: 'Seconds', value: countdown.seconds },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="w-20 h-20 rounded-xl border flex flex-col items-center justify-center gap-0.5"
                  style={{ background: '#F9F9FB', borderColor: 'rgba(245,197,107,0.6)' }}
                >
                  <span className="font-mono text-2xl font-bold text-text-primary">
                    {String(value).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-text-muted font-sans uppercase tracking-wider">{label}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-text-secondary font-sans">
              {nextMatch.title} — {nextMatch.eventDateLabel}
            </p>
          </section>
        )}

        {/* Teams */}
        <section className="mb-14">
          <h2 className="font-display font-semibold text-2xl md:text-3xl mb-6 tracking-tight">
            10 Teams · 74 Matches
          </h2>
          <div className="flex gap-6 flex-wrap">
            {TEAMS.map((t) => (
              <div key={t.abbr} className="flex flex-col items-center gap-2">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold font-mono border-2 border-white/10 shadow-lg hover:scale-110 transition-transform cursor-pointer"
                  style={{ background: t.color, color: t.textColor }}
                  title={t.name}
                >
                  {t.abbr}
                </div>
                <span className="text-[10px] text-text-muted font-sans text-center leading-tight max-w-[64px]">
                  {t.abbr}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming matches */}
        <section>
          <h2 className="font-display font-semibold text-2xl md:text-3xl mb-6 tracking-tight">
            Upcoming Fixtures
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : !iplMatches || iplMatches.length === 0 ? (
            <div className="p-6 rounded-xl bg-bg-surface border border-border-default text-center font-sans">
              <p className="text-text-muted">Schedule not yet announced. Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {iplMatches.map((match) => (
                <div
                  key={match.id}
                  className="p-5 rounded-xl bg-bg-surface border-l-4 border-t border-r border-b border-border-default hover:border-[#D4A017] transition-colors"
                  style={{ borderLeftColor: '#D4A017' }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold font-sans mb-1" style={{ color: '#F5C56B' }}>
                        {match.eventDateLabel} · {match.eventTimeLabel}
                      </p>
                      <p className="font-display font-semibold text-lg text-text-primary line-clamp-1">
                        {match.title}
                      </p>
                      <p className="text-sm text-text-muted font-sans mt-0.5 line-clamp-1">
                        {match.venueName}, {match.cityName}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      {match.lowestPrice > 0 && (
                        <p className="text-xs text-semantic-success font-semibold mb-2">
                          from ₹{match.lowestPrice.toLocaleString('en-IN')}
                        </p>
                      )}
                      <Link to={ROUTES.EVENT_DETAIL(match.slug)}>
                        <Button
                          size="sm"
                          style={{ background: 'linear-gradient(135deg, #F5C56B, #D4A017)', color: '#1a0a05' }}
                        >
                          Book →
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Booking note */}
          <div className="mt-8 p-5 rounded-xl bg-semantic-warning/10 border border-semantic-warning/30 font-sans">
            <p className="font-semibold text-semantic-warning mb-1">⚠️ IPL tickets sell out fast!</p>
            <p className="text-sm text-text-secondary">Book early to avoid disappointment. Physical ID required at stadium entry.</p>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
