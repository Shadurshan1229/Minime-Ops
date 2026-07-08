import { useState, useEffect, useRef } from 'react'
import { X, Pin, Trash2, Bold, Highlighter, RemoveFormatting } from 'lucide-react'
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
  const [pinned, setPinned] = useState(note.pinned)
  const [deleting, setDeleting] = useState(false)
  const { updateNote, removeNote } = useNotesStore()
  const titleRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = note.body
    titleRef.current?.focus()
  }, [])

  function execCmd(cmd: string, value?: string) {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value)
  }

  function applyHighlight() {
    editorRef.current?.focus()
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return
    const node = sel.getRangeAt(0).commonAncestorContainer
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement
    // Check inline style only (not computed) so parent background doesn't cause false positives
    const inlineBg = el instanceof HTMLElement ? el.style.backgroundColor : ''
    const hasHighlight = !!inlineBg && inlineBg !== 'transparent' && inlineBg !== 'rgba(0, 0, 0, 0)'
    document.execCommand('hiliteColor', false, hasHighlight ? 'transparent' : 'rgba(201,160,90,0.3)')
  }

  async function handleClose() {
    const trimTitle = title.trim()
    const textContent = editorRef.current?.textContent?.trim() ?? ''
    const rawHtml = editorRef.current?.innerHTML ?? ''

    if (!trimTitle && !textContent) {
      const { error } = await supabase.from('notes').delete().eq('id', note.id)
      if (!error) removeNote(note.id)
      onClose()
      return
    }

    const changes = {
      title: trimTitle || 'Untitled',
      body: textContent ? rawHtml : '',
      pinned,
      updated_at: new Date().toISOString(),
    }

    updateNote(note.id, changes)
    const { error } = await supabase.from('notes').update(changes).eq('id', note.id)
    if (error) updateNote(note.id, { title: note.title, body: note.body, pinned: note.pinned })
    onClose()
  }

  async function handleDelete() {
    if (!confirm('Delete this note?')) return
    setDeleting(true)
    const { error } = await supabase.from('notes').delete().eq('id', note.id)
    if (error) { setDeleting(false); return }
    removeNote(note.id)
    onClose()
  }

  async function togglePin() {
    const newPinned = !pinned
    setPinned(newPinned)
    updateNote(note.id, { pinned: newPinned })
    await supabase.from('notes').update({ pinned: newPinned }).eq('id', note.id)
  }

  const toolBtn = (): React.CSSProperties => ({
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: 'var(--r-sm)',
    cursor: 'pointer',
    color: 'var(--ink-m)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '44px', height: '44px',
    transition: 'all var(--dur-fast) var(--ease)',
  })

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

      {/* Formatting toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        padding: 'var(--sp-sm) var(--sp-xl)',
        borderBottom: '1px solid var(--hairline-s)',
        flexShrink: 0,
      }}>
        <button
          style={toolBtn()}
          onMouseDown={e => { e.preventDefault(); execCmd('bold') }}
          title="Bold (Ctrl+B)"
        >
          <Bold size={14} strokeWidth={2} />
        </button>
        <button
          style={toolBtn()}
          onMouseDown={e => { e.preventDefault(); applyHighlight() }}
          title="Highlight"
        >
          <Highlighter size={14} strokeWidth={1.5} />
        </button>
        <button
          style={toolBtn()}
          onMouseDown={e => { e.preventDefault(); execCmd('removeFormat') }}
          title="Clear formatting"
        >
          <RemoveFormatting size={14} strokeWidth={1.5} />
        </button>
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

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Write something..."
          onKeyDown={e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
              e.preventDefault()
              execCmd('bold')
            }
          }}
          style={{
            background: 'transparent', outline: 'none',
            fontFamily: 'Inter, sans-serif',
            fontSize: '15px', lineHeight: 1.6,
            color: 'var(--ink-m)', letterSpacing: '-0.01em',
            flex: 1, minHeight: '300px',
            caretColor: 'var(--red)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}
        />
      </div>

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--ink-m);
          opacity: 0.4;
          pointer-events: none;
        }
        [contenteditable] b, [contenteditable] strong {
          color: var(--ink);
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}
