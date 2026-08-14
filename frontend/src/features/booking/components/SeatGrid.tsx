import { SeatCell } from './SeatCell';
import type { ScreenLayout } from '../types';
import type { SeatState } from '@/shared/types';

interface Props {
  layout:        ScreenLayout;
  bookedSeats:   string[];
  lockedSeats:   string[];
  selectedSeats: string[];
  onSeatClick:   (label: string, state: SeatState) => void;
}

function getSeatState(
  label:         string,
  selectedSeats: string[],
  bookedSeats:   string[],
  lockedSeats:   string[],
  blockedSeats:  string[],
): SeatState {
  if (selectedSeats.includes(label)) return 'selected';
  if (bookedSeats.includes(label))   return 'booked';
  if (lockedSeats.includes(label))   return 'locked';
  if (blockedSeats.includes(label))  return 'booked';
  return 'available';
}

export function SeatGrid({ layout, bookedSeats, lockedSeats, selectedSeats, onSeatClick }: Props) {
  const { categories, cols, blockedSeats, aisleAfterCols } = layout;

  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted">
        <p className="text-sm">Seat layout not configured for this screen.</p>
        <p className="text-xs">Please contact the venue for seat selection assistance.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Screen */}
      <div className="text-center mb-8">
        <div
          className="w-[70%] max-w-[500px] mx-auto h-6 rounded-[50%/100%_100%_0_0]"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.2) 100%)',
            filter: 'drop-shadow(0 -8px 20px rgba(255,255,255,0.35))',
            transform: 'perspective(400px) rotateX(40deg)',
          }}
        />
        <p className="font-mono text-[10px] tracking-widest text-text-muted mt-4 uppercase">All eyes this way 👀</p>
      </div>

      {/* Category legend */}
      <div className="flex flex-wrap gap-3 justify-center mb-6 text-xs font-sans">
        {categories.map((cat) => (
          <span key={cat.name} className="flex items-center gap-1.5 text-text-secondary">
            <span className="w-3.5 h-3.5 rounded-[3px] inline-block" style={{ background: cat.color + '44', border: `1px solid ${cat.color}88` }} />
            {cat.name} · ₹{cat.price}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-text-secondary">
          <span className="w-3.5 h-3.5 rounded-[3px] inline-block bg-[#232C44] border border-[#3f3f46] opacity-50" />
          Booked
        </span>
        <span className="flex items-center gap-1.5 text-text-secondary">
          <span className="w-3.5 h-3.5 rounded-[3px] inline-block" style={{ background: 'rgba(245,158,11,0.5)', border: '1px solid rgba(245,158,11,0.7)' }} />
          Held
        </span>
        <span className="flex items-center gap-1.5 text-text-secondary">
          <span className="w-3.5 h-3.5 rounded-[3px] inline-block" style={{ background: '#18BC60', border: 'none' }} />
          Selected
        </span>
      </div>

      {/* Seat rows grouped by category */}
      {(() => {
        let lastCat = '';
        return categories.flatMap((cat) =>
          cat.rows.map((rowLetter) => {
            const isFirstInCat = cat.name !== lastCat;
            lastCat = cat.name;
            return (
              <div key={rowLetter}>
                {isFirstInCat && (
                  <div className="flex items-center gap-2 my-3 pl-6">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                    <span className="font-mono text-[10px] text-text-secondary uppercase tracking-wider">
                      {cat.name}
                    </span>
                    <span className="font-mono text-[10px] text-text-muted ml-auto pr-2">₹{cat.price}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 mb-1.5 px-1">
                  <span className="font-mono text-[10px] text-text-muted w-5 text-center flex-shrink-0">{rowLetter}</span>
                  <div className="flex gap-1">
                    {Array.from({ length: cols }, (_, colIdx) => {
                      const col   = colIdx + 1;
                      const label = `${rowLetter}${col}`;
                      const state = getSeatState(label, selectedSeats, bookedSeats, lockedSeats, blockedSeats);
                      return (
                        <div key={label} className="flex items-center gap-1">
                          {aisleAfterCols.includes(colIdx) && (
                            <div className="w-3 flex-shrink-0" />
                          )}
                          <SeatCell
                            label={label}
                            state={state}
                            color={cat.color}
                            onClick={() => onSeatClick(label, state)}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <span className="font-mono text-[10px] text-text-muted w-5 text-center flex-shrink-0">{rowLetter}</span>
                </div>
              </div>
            );
          })
        );
      })()}
    </div>
  );
}
