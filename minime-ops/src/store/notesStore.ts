import { create } from 'zustand'
import type { Note } from '../types'

type NotesStore = {
  notes: Note[]
  setNotes: (n: Note[]) => void
  addNote: (n: Note) => void
  updateNote: (id: string, changes: Partial<Note>) => void
  removeNote: (id: string) => void
}

export const useNotesStore = create<NotesStore>((set) => ({
  notes: [],
  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((s) => ({ notes: [note, ...s.notes] })),
  updateNote: (id, changes) => set((s) => ({
    notes: s.notes.map(n => n.id === id ? { ...n, ...changes } : n),
  })),
  removeNote: (id) => set((s) => ({ notes: s.notes.filter(n => n.id !== id) })),
}))
