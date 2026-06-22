import Nav from './Nav'

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--canvas)', display: 'flex' }}>
      <Nav />
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '80px' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
