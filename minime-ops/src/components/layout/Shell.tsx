import Nav from './Nav'

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--canvas)', display: 'flex' }}>
      <style>{`
        .shell-main { flex: 1; overflow-y: auto; min-width: 0; }
        .shell-content {
          max-width: 1100px;
          margin: 0 auto;
          padding-bottom: 80px;
          padding-top: 52px; /* mobile top bar offset */
        }
        @media (min-width: 640px) {
          .shell-content { padding-top: 0; }
        }
      `}</style>
      <Nav />
      <main className="shell-main">
        <div className="shell-content">
          {children}
        </div>
      </main>
    </div>
  )
}
