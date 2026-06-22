import { useEffect } from 'react'
import { supabase } from './lib/supabase'
import { useAppStore } from './store/appStore'
import Shell from './components/layout/Shell'
import Login from './pages/Login'
import Calculator from './pages/Calculator'
import Orders from './pages/Orders'
import Notes from './pages/Notes'
import Settings from './pages/Settings'

export default function App() {
  const { session, setSession, activePage } = useAppStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null  // still resolving
  if (session === null) return <Login />

  return (
    <Shell>
      {activePage === 'calculator' && <Calculator />}
      {activePage === 'orders' && <Orders />}
      {activePage === 'notes' && <Notes />}
      {activePage === 'settings' && <Settings />}
    </Shell>
  )
}
