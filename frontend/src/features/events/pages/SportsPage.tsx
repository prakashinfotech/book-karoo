import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';
import EventsPage from './EventsPage';

export default function SportsPage() {
  return (
    <>
      {/* IPL promo strip */}
      <div className="bg-gradient-to-r from-[#1a0a05] via-[#2d0a0e] to-[#1a0535] border-b border-border-default">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🏏</span>
            <div>
              <p className="text-[11px] font-semibold text-[#F5C56B] tracking-widest uppercase font-sans">TATA IPL 2026</p>
              <p className="text-sm text-white font-sans font-medium">Book your seats for the world's biggest cricket tournament</p>
            </div>
          </div>
          <Link
            to={ROUTES.IPL}
            className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold font-sans transition-all"
            style={{ background: 'linear-gradient(135deg, #F5C56B, #D4A017)', color: '#1a0a05' }}
          >
            View Matches →
          </Link>
        </div>
      </div>
      <EventsPage fixedType="ipl" title="Sports Events" noCityFilter />
    </>
  );
}
