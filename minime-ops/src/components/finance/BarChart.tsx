type Bar = { label: string; amount: number }
type Props = { bars: Bar[]; color?: string; height?: number }

export default function BarChart({ bars, color = 'var(--red)', height = 120 }: Props) {
  if (bars.length === 0) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '12px', color: 'var(--ink-m)' }}>No data</span>
    </div>
  )

  const max = Math.max(...bars.map(b => b.amount), 1)
  const barW = Math.min(32, Math.floor(280 / bars.length) - 4)
  const totalW = bars.length * (barW + 4)

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${totalW} ${height}`} preserveAspectRatio="xMidYMid meet">
      {bars.map((b, i) => {
        const barH = Math.max(2, (b.amount / max) * (height - 24))
        const x = i * (barW + 4)
        const y = height - 20 - barH
        const dateLabel = new Date(b.label).toLocaleDateString('en-LK', { day: 'numeric', month: 'short' })
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill={color} rx={3} opacity={0.85} />
            <text x={x + barW / 2} y={height - 4} textAnchor="middle" fontSize={8} fill="var(--ink-m)">
              {dateLabel}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
