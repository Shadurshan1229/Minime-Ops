import type { OrderStatus } from '../../types'

type StatusPillProps = {
  status: OrderStatus
}

const STATUS_CONFIG: Record<OrderStatus, { bg: string; color: string; label: string }> = {
  new:         { bg: '#1A1A0E',                 color: '#C9A05A',                     label: 'New' },
  confirmed:   { bg: 'var(--status-printing-bg)', color: 'var(--status-printing-text)', label: 'Confirmed' },
  in_progress: { bg: '#0E1020',                 color: '#8B9FD4',                     label: 'In Progress' },
  ready:       { bg: 'var(--status-ready-bg)',  color: 'var(--status-ready-text)',    label: 'Ready' },
  delivered:   { bg: 'var(--red-dim)',           color: 'var(--red)',                  label: 'Delivered' },
  cancelled:   { bg: 'var(--s2)',               color: 'var(--ink-m)',                label: 'Cancelled' },
}

export default function StatusPill({ status }: StatusPillProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '4px 10px',
      borderRadius: 'var(--r-sm)',
      background: config.bg,
      color: config.color,
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      fontWeight: 500,
      letterSpacing: '-0.01em',
      lineHeight: 1,
    }}>
      <span style={{
        width: '5px',
        height: '5px',
        borderRadius: '50%',
        background: config.color,
        flexShrink: 0,
      }} />
      {config.label}
    </span>
  )
}
