import { useState, useEffect, useRef } from 'react'
import { X, Pin, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useNotesStore } from '../../store/notesStore'
import type { Note } from '../../types'
import Button from '../ui/Button'

type Props = {
  note: Note
  onClose: () => void
}

export default function NoteEditor({ note, onClose }: Props) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [pinned, setPinned] = useState(note.pinned)
  const [deleting, setDeleting] = useState(false)
  const { updateNote, removeNote } = useNotesStore()
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  async function handleClose() {
    const trimTitle = title.trim()
    const trimBody = body.trim()

    if (!trimTitle && !trimBody) {
      await supabase.from('notes').delete().eq('id', note.id)
      removeNote(note.id)
      onClose()
      return
    }

    const changes = {
      title: trimTitle || 'Untitled',
      body: trimBody,
      pinned,
      updated_at: new Date().toISOString(),
    }

    updateNote(note.id, changes)
    await supabase.from('notes').update(changes).eq('id', note.id)
    onClose()
  }

  async function handleDelete() {
    if (!confirm('Delete this note?')) return
    setDeleting(true)
    removeNote(note.id)
    await supabase.from('notes').delete().eq('id', note.id)
    onClose()
  }

  async function togglePin() {
    const newPinned = !pinned
    setPinned(newPinned)
    updateNote(note.id, { pinned: newPinned })
    await supabase.from('notes').update({ pinned: newPinned }).eq('id', note.id)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'var(--canvas)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--sp-lg) var(--sp-xl)',
        borderBottom: '1px solid var(--hairline-s)',
        flexShrink: 0,
      }}>
        <Button variant="icon" onClick={handleClose}>
          <X size={16} strokeWidth={1.5} />
        </Button>

        <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
          <Button
            variant="icon"
            onClick={togglePin}
            style={{
              background: pinned ? 'var(--red-dim)' : 'var(--s1)',
              border: pinned ? '1px solid rgba(240,78,62,0.2)' : '1px solid var(--hairline)',
            }}
          >
            <Pin size={15} strokeWidth={1.5} color={pinned ? 'var(--red)' : 'var(--ink-m)'} />
          </Button>

          <Button variant="icon" onClick={handleDelete} disabled={deleting}>
            <Trash2 size={15} strokeWidth={1.5} color="var(--ink-m)" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: 'var(--sp-xl)',
        display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)',
      }}>
        <input
          ref={titleRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'Geist, sans-serif',
            fontSize: '22px', fontWeight: 600,
            color: 'var(--ink)', letterSpacing: '-0.02em',
            width: '100%',
          }}
        />

        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write something..."
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'Inter, sans-serif',
            fontSize: '15px', lineHeight: 1.6,
            color: 'var(--ink-m)', letterSpacing: '-0.01em',
            width: '100%', flex: 1,
            resize: 'none', minHeight: '300px',
          }}
        />
      </div>
    </div>
  )
}
