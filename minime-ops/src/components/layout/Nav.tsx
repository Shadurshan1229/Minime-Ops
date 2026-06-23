import { useState } from 'react'
import { Calculator, Package, StickyNote, TrendingUp, LogOut, Menu, X, Settings } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAppStore } from '../../store/appStore'
import type { Page } from '../../types'

const ITEMS: { page: Page; label: string; Icon: React.ComponentType<{ size: number; strokeWidth: number }> }[] = [
  { page: 'calculator', label: 'Calculator', Icon: Calculator },
  { page: 'orders',     label: 'Orders',     Icon: Package },
  { page: 'notes',      label: 'Notes',      Icon: StickyNote },
  { page: 'finance',    label: 'Finance',    Icon: TrendingUp },
]

export default function Nav() {
  const { activePage, setActivePage } = useAppStore()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <style>{`
        /* ── Mobile top bar ── */
        .nav-topbar {
          display: flex;
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 52px;
          padding: 0 16px;
          background: var(--canvas);
          border-bottom: 1px solid var(--hairline-s);
          z-index: 100;
          align-items: center;
          justify-content: space-between;
        }
        .nav-topbar-logo {
          font-family: Geist, sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: var(--ink);
          letter-spacing: -0.02em;
        }
        .nav-topbar-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: var(--r-pill);
          border: 1px solid var(--hairline);
          background: var(--s1);
          color: var(--ink-m);
          cursor: pointer;
        }

        /* ── Mobile: fixed bottom pill ── */
        .nav-root {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          padding: 8px 16px;
          padding-bottom: max(8px, env(safe-area-inset-bottom));
          background: var(--canvas);
          border-top: 1px solid var(--hairline-s);
          z-index: 100;
        }
        .nav-pill {
          display: flex;
          background: var(--canvas);
          border: 1px solid var(--hairline);
          border-radius: var(--r-pill);
          padding: 5px;
          gap: 4px;
        }
        .nav-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 6px 4px;
          min-height: 52px;
          border-radius: var(--r-pill);
          border: none;
          cursor: pointer;
          background: transparent;
          color: var(--ink-m);
          font-family: Inter, sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: -0.01em;
          transition: background 150ms ease, color 150ms ease;
        }
        .nav-btn.active {
          background: var(--red);
          color: #fff;
          box-shadow: 0 2px 12px var(--red-glow);
        }

        /* Desktop-only elements hidden on mobile */
        .nav-logo    { display: none; }
        .nav-signout { display: none; }

        /* ── Desktop: sticky left sidebar ── */
        @media (min-width: 640px) {
          .nav-topbar { display: none; }

          .nav-root {
            position: sticky;
            top: 0;
            bottom: auto; left: auto; right: auto;
            width: 200px;
            flex-shrink: 0;
            height: 100dvh;
            padding: 24px 12px;
            border-top: none;
            border-right: 1px solid var(--hairline-s);
            display: flex;
            flex-direction: column;
          }
          .nav-pill {
            flex-direction: column;
            border: none;
            background: transparent;
            padding: 0;
            gap: 2px;
            flex: 1;
          }
          /* CRITICAL: buttons must NOT flex-grow on desktop */
          .nav-btn {
            flex: none;
            flex-direction: row;
            justify-content: flex-start;
            padding: 10px 14px;
            font-size: 13px;
            gap: 8px;
            min-height: 44px;
          }
          .nav-logo {
            display: block;
            font-family: Geist, sans-serif;
            font-size: 15px;
            font-weight: 700;
            color: var(--ink);
            letter-spacing: -0.02em;
            padding: 0 14px;
            margin-bottom: 24px;
          }
          .nav-signout {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 10px 14px;
            min-height: 44px;
            border-radius: var(--r-pill);
            border: none;
            cursor: pointer;
            background: transparent;
            color: var(--ink-m);
            font-family: Inter, sans-serif;
            font-size: 13px;
            font-weight: 500;
            letter-spacing: -0.01em;
            transition: color 150ms ease;
          }
          .nav-signout:hover { color: var(--ink); }
        }
      `}</style>

      {/* Mobile top bar */}
      <div className="nav-topbar">
        <span className="nav-topbar-logo">Minime HQ</span>
        <button className="nav-topbar-btn" onClick={() => setMenuOpen(true)}>
          <Menu size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Menu overlay (mobile) */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'flex-end',
          }}
          onClick={() => setMenuOpen(false)}
        >
          <div
            style={{
              width: '100%',
              background: 'var(--s2)',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
              padding: '16px 16px 40px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '20px',
            }}>
              <span style={{ fontFamily: 'Geist, sans-serif', fontSize: '15px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                Minime HQ
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-m)', display: 'flex', padding: '4px' }}
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <button
              onClick={() => { setActivePage('settings'); setMenuOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                width: '100%', padding: '14px 4px', minHeight: '52px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--ink-m)', fontFamily: 'Inter, sans-serif',
                fontSize: '14px', fontWeight: 500, letterSpacing: '-0.01em',
                borderRadius: 'var(--r-md)', borderBottom: '1px solid var(--hairline-s)',
              }}
            >
              <Settings size={18} strokeWidth={1.5} />
              Settings
            </button>
            <button
              onClick={() => { supabase.auth.signOut(); setMenuOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                width: '100%', padding: '14px 4px', minHeight: '52px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--ink-m)', fontFamily: 'Inter, sans-serif',
                fontSize: '14px', fontWeight: 500, letterSpacing: '-0.01em',
                borderRadius: 'var(--r-md)',
              }}
            >
              <LogOut size={18} strokeWidth={1.5} />
              Sign out
            </button>
          </div>
        </div>
      )}

      <nav className="nav-root">
        <span className="nav-logo">Minime HQ</span>

        <div className="nav-pill">
          {ITEMS.map(({ page, label, Icon }) => (
            <button
              key={page}
              className={`nav-btn${activePage === page ? ' active' : ''}`}
              onClick={() => setActivePage(page)}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Settings + Sign out — desktop only */}
        <button
          className="nav-signout"
          onClick={() => setActivePage('settings')}
          style={{ color: activePage === 'settings' ? 'var(--ink)' : undefined }}
        >
          <Settings size={18} strokeWidth={1.5} />
          <span>Settings</span>
        </button>
        <button className="nav-signout" onClick={() => supabase.auth.signOut()}>
          <LogOut size={18} strokeWidth={1.5} />
          <span>Sign out</span>
        </button>
      </nav>
    </>
  )
}
