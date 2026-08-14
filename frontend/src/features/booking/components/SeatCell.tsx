import { memo } from 'react';
import { cn } from '@/shared/lib/utils';
import type { SeatState } from '@/shared/types';

interface Props {
  label:   string;
  state:   SeatState;
  color:   string;
  onClick: () => void;
}

function SeatCellComponent({ label, state, color, onClick }: Props) {
  const unavailable = state === 'booked' || state === 'locked';
  // Extract column number from label e.g. "A12" → "12", "AB3" → "3"
  const seatNum = label.replace(/^[A-Za-z]+/, '');

  return (
    <button
      disabled={unavailable}
      onClick={onClick}
      title={unavailable ? (state === 'locked' ? 'Held by another user' : 'Booked') : label}
      aria-label={`Seat ${label} — ${state}`}
      className={cn(
        'w-7 h-7 md:w-8 md:h-8 rounded flex items-center justify-center text-[7px] md:text-[8px] font-mono font-bold flex-shrink-0 transition-all duration-150 leading-none',
        state === 'available' && 'hover:scale-110 cursor-pointer',
        state === 'selected'  && 'cursor-pointer ring-2 ring-white/30 shadow-[0_0_0_2px_rgba(24,188,96,0.4)]',
        state === 'booked'    && 'cursor-not-allowed opacity-40',
        state === 'locked'    && 'cursor-not-allowed'
      )}
      style={
        state === 'available' ? { background: color + '33', border: `1px solid ${color}66`, color } :
        state === 'selected'  ? { background: '#18BC60', border: 'none', color: '#fff' } :
        state === 'booked'    ? { background: '#CCCCCC', border: '1px solid #BBBBBB', color: '#888' } :
        /* locked */            { background: 'rgba(245,158,11,0.5)', border: '1px solid rgba(245,158,11,0.7)', color: '#fff' }
      }
    >
      {state === 'locked'
        ? <span style={{ fontSize: 7 }}>🔒</span>
        : seatNum}
    </button>
  );
}

export const SeatCell = memo(SeatCellComponent);
