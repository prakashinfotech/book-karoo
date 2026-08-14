interface CountdownRingProps {
  totalSeconds: number;
  remainingSeconds: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}

export function CountdownRing({
  totalSeconds,
  remainingSeconds,
  size = 64,
  strokeWidth = 5,
  showLabel = true,
  className,
}: CountdownRingProps) {
  const r = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, remainingSeconds / totalSeconds));
  const dash = circumference * pct;
  const elapsed = 1 - pct;

  const color =
    elapsed < 0.6
      ? '#10B981'
      : elapsed < 0.85
      ? '#F59E0B'
      : '#EF4444';

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const label = `${mins}:${String(secs).padStart(2, '0')}`;

  return (
    <span className={`relative inline-flex items-center justify-center ${className ?? ''}`}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#232C44" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s ease' }}
        />
      </svg>
      {showLabel && (
        <span
          className="absolute font-mono font-semibold tracking-tight"
          style={{ fontSize: size * 0.22, color }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
