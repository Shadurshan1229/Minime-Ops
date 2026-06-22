import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import type { Page } from '../types'

type AppStore = {
  activePage: Page
  setActivePage: (page: Page) => void
  session: Session | null | undefined  // undefined = not yet checked
  setSession: (session: Session | null) => void
}

export const useAppStore = create<AppStore>((set) => ({
  activePage: 'calculator',
  setActivePage: (page) => set({ activePage: page }),
  session: undefined,
  setSession: (session) => set({ session }),
}))
