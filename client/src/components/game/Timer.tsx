interface Props {
  seconds: number;
}

export default function Timer({ seconds }: Props) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pct = Math.min(seconds / 300, 1); // assume 5 min max
  const isUrgent = seconds <= 30;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`text-5xl font-mono font-bold tabular-nums ${isUrgent ? 'text-red-400 animate-pulse' : 'text-moon-400'}`}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </div>
      <div className="w-48 h-2 bg-night-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isUrgent ? 'bg-red-500' : 'bg-moon-500'}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}
