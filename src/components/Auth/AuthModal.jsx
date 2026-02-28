import { useState } from 'react'
import useAuthStore from '../../store/authStore'

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  const signInWithEmail = useAuthStore((s) => s.signInWithEmail)
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail)
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const action = mode === 'signin' ? signInWithEmail : signUpWithEmail
    const { error: authError } = await action(email, password)

    setLoading(false)
    if (authError) {
      setError(authError.message)
    } else if (mode === 'signup') {
      setSignUpSuccess(true)
    } else {
      onClose()
    }
  }

  const handleGoogle = async () => {
    setError('')
    const { error: authError } = await signInWithGoogle()
    if (authError) setError(authError.message)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-paper rounded-lg shadow-lg w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg mb-4">
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h2>

        {signUpSuccess ? (
          <div className="text-sm">
            <p className="text-green-700 mb-3">Check your email to confirm your account.</p>
            <button onClick={onClose} className="text-accent text-sm hover:underline">Close</button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full rounded border border-border bg-canvas px-3 py-2 text-sm"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="block w-full rounded border border-border bg-canvas px-3 py-2 text-sm"
              />
              {error && <p className="text-red-600 text-xs">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-paper py-2 rounded text-sm font-medium hover:bg-accentMuted transition-colors disabled:opacity-40"
              >
                {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              onClick={handleGoogle}
              className="w-full border border-border bg-canvas py-2 rounded text-sm font-medium hover:bg-paper transition-colors"
            >
              Continue with Google
            </button>

            <p className="text-xs text-muted mt-4 text-center">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
                className="text-accent hover:underline"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
