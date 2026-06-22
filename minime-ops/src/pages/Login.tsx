import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email.trim() || !password) { setError('Enter email and password'); return }
    setLoading(true)
    setError('')

    const { error: sbError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)
    if (sbError) setError('Invalid email or password')
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--canvas)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--sp-xl)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '360px',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-xl)',
      }}>

        <div style={{ marginBottom: 'var(--sp-sm)' }}>
          <img
            src="/minime_logo.svg"
            alt="Minime"
            style={{ height: '32px', width: 'auto', marginBottom: '16px', display: 'block' }}
          />
          <div style={{ fontSize: '13px', color: 'var(--ink-m)' }}>
            Sign in to continue
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            onKeyDown={e => { if (e.key === 'Enter') handleLogin() }}
          />
        </div>

        {error && (
          <div style={{ fontSize: '13px', color: 'var(--red)', letterSpacing: '-0.01em' }}>
            {error}
          </div>
        )}

        <Button
          variant="primary"
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>

      </div>
    </div>
  )
}
