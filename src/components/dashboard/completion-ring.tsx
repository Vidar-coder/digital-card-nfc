export function CompletionRing({ percent, size = 44, stroke = 4 }: { percent: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = percent >= 80 ? "#059669" : percent >= 50 ? "#4f46e5" : "#d97706";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Profile ${percent}% complete`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e4e4e7" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (percent / 100) * c}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold tabular-nums text-zinc-800">
        {percent}%
      </span>
    </div>
  );
}
