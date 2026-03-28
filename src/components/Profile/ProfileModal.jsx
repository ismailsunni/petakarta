import { useState } from 'react'
import useAuthStore from '../../store/authStore'
import { updateProfile, checkUsernameAvailable } from '../../lib/profilesService'

const USERNAME_RE = /^[a-z0-9-]{3,30}$/

export default function ProfileModal({ onClose }) {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [username, setUsername] = useState(profile?.username || '')
  const [usernameStatus, setUsernameStatus] = useState(null) // 'checking'|'available'|'taken'|'invalid'
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleUsernameBlur = async () => {
    if (!username) { setUsernameStatus(null); return }
    if (!USERNAME_RE.test(username)) { setUsernameStatus('invalid'); return }
    if (username === profile?.username) { setUsernameStatus('available'); return }
    setUsernameStatus('checking')
    const { available } = await checkUsernameAvailable(username)
    setUsernameStatus(available ? 'available' : 'taken')
  }

  const handleSave = async () => {
    if (!user) return
    if (username && !USERNAME_RE.test(username)) return
    if (usernameStatus === 'taken') return
    setSaving(true)
    setError('')
    const updates = { full_name: fullName }
    if (username) updates.username = username
    const { data, error: err } = await updateProfile(user.id, updates)
    if (err) { setError(err.message); setSaving(false); return }
    useAuthStore.setState({ profile: data })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-paper rounded-lg shadow-lg w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg mb-4">Edit Profile</h2>

        {profile?.avatar_url && (
          <img
            src={profile.avatar_url}
            alt="Avatar"
            className="w-16 h-16 rounded-full mb-4 object-cover"
          />
        )}

        {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted block mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded border border-border bg-canvas px-3 py-1.5 text-sm"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value.toLowerCase()); setUsernameStatus(null) }}
              onBlur={handleUsernameBlur}
              className="w-full rounded border border-border bg-canvas px-3 py-1.5 text-sm"
              placeholder="3–30 chars, lowercase, hyphens ok"
            />
            {usernameStatus === 'checking' && <p className="text-xs text-muted mt-1">Checking…</p>}
            {usernameStatus === 'available' && <p className="text-xs text-green-600 mt-1">Available</p>}
            {usernameStatus === 'taken' && <p className="text-xs text-red-600 mt-1">Username taken</p>}
            {usernameStatus === 'invalid' && (
              <p className="text-xs text-red-600 mt-1">3–30 chars, lowercase letters, numbers, hyphens only</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="text-sm text-muted hover:text-ink transition-colors px-2 py-1">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'checking'}
            className="bg-accent text-paper px-3 py-1 rounded text-sm font-medium hover:bg-accentMuted transition-colors disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
