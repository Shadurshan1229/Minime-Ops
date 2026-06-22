import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNotesStore } from '../store/notesStore'
import PageHeader from '../components/ui/PageHeader'
import NoteCard from '../components/notes/NoteCard'
import NoteEditor from '../components/notes/NoteEditor'
import type { Note } from '../types'

export default function Notes() {
  const { notes, setNotes, addNote } = useNotesStore()
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('notes')
      .select('*')
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (data) setNotes(data)
        setLoading(false)
      })
  }, [])

  async function handleNew() {
    const { data, error } = await supabase
      .from('notes')
      .insert({ title: '', body: '', pinned: false })
      .select()
      .single()

    if (error || !data) return
    addNote(data)
    setActiveNote(data)
  }

  const sorted = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })

  return (
    <>
      <div>
        <PageHeader title="Notes" subtitle="Ideas and observations" />

        <div style={{ padding: '0 var(--sp-xl) var(--sp-xl)' }}>
          {loading && (
            <div style={{ color: 'var(--ink-m)', fontSize: '13px' }}>Loading...</div>
          )}

          {!loading && notes.length === 0 && (
            <div style={{
              textAlign: 'center', padding: 'var(--sp-sec) 0',
              color: 'var(--ink-m)', fontSize: '14px',
            }}>
              No notes yet. Tap + to add one.
            </div>
          )}

          {sorted.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 'var(--sp-md)',
            }}>
              {sorted.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onClick={() => setActiveNote(note)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={handleNew}
        style={{
          position: 'fixed',
          bottom: 'calc(80px + var(--sp-lg))',
          right: 'var(--sp-xl)',
          width: '52px', height: '52px',
          borderRadius: 'var(--r-full)',
          background: 'var(--red)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 1px var(--red-ring), 0 4px 20px var(--red-glow)',
          zIndex: 50,
          transition: 'transform var(--dur-fast) var(--ease)',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Plus size={22} strokeWidth={2} color="#fff" />
      </button>

      {activeNote && (
        <NoteEditor
          note={activeNote}
          onClose={() => setActiveNote(null)}
        />
      )}
    </>
  )
}
