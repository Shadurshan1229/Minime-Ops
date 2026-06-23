type Slice = { name: string; amount: number; color: string }

type Props = { slices: Slice[]; size?: number }

export default function PieChart({ slices, size = 160 }: Props) {
  const total = slices.reduce((s, i) => s + i.amount, 0)
  if (total === 0) return null

  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 8

  let cumAngle = -Math.PI / 2

  const paths = slices.map((slice) => {
    const angle = (slice.amount / total) * 2 * Math.PI
    const x1 = cx + r * Math.cos(cumAngle)
    const y1 = cy + r * Math.sin(cumAngle)
    cumAngle += angle
    const x2 = cx + r * Math.cos(cumAngle)
    const y2 = cy + r * Math.sin(cumAngle)
    const large = angle > Math.PI ? 1 : 0
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
    return { d, color: slice.color, name: slice.name, amount: slice.amount }
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} stroke="var(--canvas)" strokeWidth={2} />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.52} fill="var(--s1)" />
    </svg>
  )
}
