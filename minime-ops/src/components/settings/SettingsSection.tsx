type Props = {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}

export default function SettingsSection({ title, action, children }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--ink-m)',
        }}>
          {title}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
