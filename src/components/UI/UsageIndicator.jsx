export default function UsageIndicator({ current, max, label }) {
  const pct = max > 0 ? (current / max) * 100 : 0
  const barColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-400' : 'bg-accent'

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted shrink-0">
        {current} / {max} {label}
      </span>
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}
