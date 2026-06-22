import { Pin } from 'lucide-react'
import type { Note } from '../../types'

type Props = {
  note: Note
  onClick: () => void
}

export default function NoteCard({ note, onClick }: Props) {
  const isPinned = note.pinned

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-sm)',
        padding: 'var(--sp-lg)',
        background: isPinned ? 'var(--red-dim)' : 'var(--s1)',
        border: isPinned
          ? '1px solid rgba(240, 78, 62, 0.2)'
          : '1px solid var(--hairline-s)',
        borderRadius: 'var(--r-lg)',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'border-color var(--dur-instant) var(--ease)',
      }}
      onMouseEnter={e => {
        if (!isPinned) e.currentTarget.style.borderColor = 'var(--hairline)'
      }}
      onMouseLeave={e => {
        if (!isPinned) e.currentTarget.style.borderColor = 'var(--hairline-s)'
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 'var(--sp-sm)',
      }}>
        <div style={{
          fontFamily: 'Geist, sans-serif',
          fontSize: '14px', fontWeight: 600,
          color: isPinned ? 'var(--red)' : 'var(--ink)',
          letterSpacing: '-0.01em',
          lineHeight: 1.3,
          flex: 1,
        }}>
          {note.title || 'Untitled'}
        </div>
        {isPinned && (
          <Pin size={13} strokeWidth={1.5} color="var(--red)"
            style={{ flexShrink: 0, marginTop: '2px' }} />
        )}
      </div>

      {note.body && (
        <div style={{
          fontSize: '13px',
          color: 'var(--ink-m)',
          letterSpacing: '-0.01em',
          lineHeight: 1.55,
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {note.body}
        </div>
      )}

      <div style={{
        fontSize: '11px', color: 'var(--ink-m)',
        marginTop: 'var(--sp-xs)',
        letterSpacing: '-0.01em',
      }}>
        {new Date(note.updated_at).toLocaleDateString('en-LK', {
          day: 'numeric', month: 'short',
        })}
      </div>
    </button>
  )
}
