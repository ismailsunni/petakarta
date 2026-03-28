import { useCallback, useEffect, useRef, useState } from 'react'
import useAuthStore from '../store/authStore'
import useLayerTreeStore from '../store/layerTreeStore'
import { supabase } from '../lib/supabase'
import AuthModal from './Auth/AuthModal'
import ProjectsPanel from './Projects/ProjectsPanel'
import ProfileModal from './Profile/ProfileModal'
import {
  saveProject,
  updateProject,
} from '../lib/projectsService'

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private', icon: '🔒' },
  { value: 'unlisted', label: 'Unlisted', icon: '🔗' },
  { value: 'public', label: 'Public', icon: '🌐' },
]

function SaveAsDialog({ onSave, onCancel }) {
  const [name, setName] = useState('')
  const [visibility, setVisibility] = useState('private')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div
        className="bg-paper rounded-lg shadow-lg w-full max-w-xs mx-4 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-sm mb-3">Save Project As</h3>
        <input
          type="text"
          placeholder="Project name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onSave(name.trim(), visibility)}
          autoFocus
          className="w-full rounded border border-border bg-canvas px-3 py-1.5 text-sm mb-3"
        />
        <div className="mb-4">
          <label className="text-xs text-muted block mb-1">Visibility</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full rounded border border-border bg-canvas px-3 py-1.5 text-sm"
          >
            {VISIBILITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.icon} {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="text-sm text-muted hover:text-ink transition-colors px-2 py-1">
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onSave(name.trim(), visibility)}
            disabled={!name.trim()}
            className="bg-accent text-paper px-3 py-1 rounded text-sm font-medium hover:bg-accentMuted transition-colors disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Header() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const loading = useAuthStore((s) => s.loading)
  const signOut = useAuthStore((s) => s.signOut)
  const activeProjectId = useLayerTreeStore((s) => s.activeProjectId)
  const activeProjectName = useLayerTreeStore((s) => s.activeProjectName)
  const activeProjectVisibility = useLayerTreeStore((s) => s.activeProjectVisibility)
  const [showAuth, setShowAuth] = useState(false)
  const [showProjects, setShowProjects] = useState(false)
  const [showSaveAs, setShowSaveAs] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [saving, setSaving] = useState(false)
  const menuRef = useRef(null)
  const renameRef = useRef(null)

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  // Focus rename input
  useEffect(() => {
    if (renaming && renameRef.current) {
      renameRef.current.focus()
      renameRef.current.select()
    }
  }, [renaming])

  const captureThumbnail = useCallback((projectId) => {
    const handleCaptured = (e) => {
      window.removeEventListener('thumbnailCaptured', handleCaptured)
      const { dataUrl } = e.detail
      if (dataUrl && projectId) {
        updateProject(projectId, { thumbnail_url: dataUrl })
      }
    }
    window.addEventListener('thumbnailCaptured', handleCaptured)
    window.dispatchEvent(new CustomEvent('captureThumbnail', { detail: { projectId } }))
  }, [])

  const handleSave = useCallback(async () => {
    if (!user) return
    setSaving(true)
    if (activeProjectId) {
      const state = useLayerTreeStore.getState().getProjectState()
      await updateProject(activeProjectId, { state_json: state })
      captureThumbnail(activeProjectId)
    } else {
      setShowSaveAs(true)
    }
    setSaving(false)
  }, [user, activeProjectId, captureThumbnail])

  const handleSaveAs = useCallback(async (name, visibility) => {
    if (!user) return
    setSaving(true)
    const state = useLayerTreeStore.getState().getProjectState()
    const { data } = await saveProject(user.id, name, state, visibility)
    if (data) {
      useLayerTreeStore.setState({
        activeProjectId: data.id,
        activeProjectName: data.name,
        activeProjectVisibility: data.visibility ?? 'private',
        activeProjectSlug: data.slug ?? null,
      })
      captureThumbnail(data.id)
    }
    setSaving(false)
    setShowSaveAs(false)
  }, [user, captureThumbnail])

  const handleChangeVisibility = useCallback(async (newVisibility) => {
    if (!activeProjectId) return
    await updateProject(activeProjectId, {
      visibility: newVisibility,
      is_public: newVisibility === 'public',
    })
    useLayerTreeStore.setState({ activeProjectVisibility: newVisibility })
  }, [activeProjectId])

  const handleRenameSubmit = useCallback(async () => {
    const trimmed = renameValue.trim()
    if (!trimmed || !activeProjectId || trimmed === activeProjectName) {
      setRenaming(false)
      return
    }
    await updateProject(activeProjectId, { name: trimmed })
    useLayerTreeStore.setState({ activeProjectName: trimmed })
    setRenaming(false)
  }, [renameValue, activeProjectId, activeProjectName])

  const handleNewProject = useCallback(() => {
    useLayerTreeStore.getState().reset()
    setShowMenu(false)
  }, [])

  // Ctrl+S / Cmd+S shortcut
  useEffect(() => {
    if (!user) return
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [user, handleSave])

  const visibilityOption = VISIBILITY_OPTIONS.find((o) => o.value === activeProjectVisibility) ?? VISIBILITY_OPTIONS[0]
  const displayName = profile?.full_name || profile?.username || user?.email

  return (
    <>
      <header className="h-[52px] bg-ink text-paper flex items-center justify-between px-5 shrink-0 border-b border-ink/20">
        <div className="flex items-center gap-3">
          <a href={import.meta.env.BASE_URL} className="font-display text-xl tracking-tight hover:opacity-80 transition-opacity">PetaKarta</a>
          {supabase && !loading && user ? (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-paper/40 hidden sm:inline">—</span>
              {renaming ? (
                <input
                  ref={renameRef}
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit()
                    if (e.key === 'Escape') setRenaming(false)
                  }}
                  className="bg-transparent border-b border-paper/40 text-paper text-sm outline-none px-1 py-0.5 w-40 font-medium"
                />
              ) : (
                <button
                  onClick={() => {
                    if (activeProjectId) {
                      setRenameValue(activeProjectName || '')
                      setRenaming(true)
                    }
                  }}
                  className={`text-sm font-medium transition-colors hidden sm:inline ${
                    activeProjectId
                      ? 'text-paper/90 hover:text-paper cursor-text'
                      : 'text-paper/50 cursor-default'
                  }`}
                  title={activeProjectId ? 'Click to rename' : ''}
                >
                  {activeProjectName || 'Untitled'}
                </button>
              )}
              {activeProjectId && (
                <select
                  value={activeProjectVisibility}
                  onChange={(e) => handleChangeVisibility(e.target.value)}
                  title="Project visibility"
                  className="bg-transparent text-paper/70 hover:text-paper border-none outline-none text-sm cursor-pointer"
                >
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-ink text-paper">
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm text-paper/80 hover:text-paper transition-colors ml-1 bg-paper/10 px-2.5 py-1 rounded hover:bg-paper/20 disabled:opacity-40"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-paper/80 hover:text-paper transition-colors px-1.5 py-1 rounded hover:bg-paper/10 text-lg leading-none"
                  title="More actions"
                >
                  &#8942;
                </button>
                {showMenu && (
                  <div className="absolute top-full right-0 mt-1 bg-paper text-ink rounded-lg shadow-lg border border-border py-1 min-w-[160px] z-50">
                    <button
                      onClick={() => { setShowSaveAs(true); setShowMenu(false) }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-canvas transition-colors"
                    >
                      Save As...
                    </button>
                    <button
                      onClick={handleNewProject}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-canvas transition-colors"
                    >
                      New Project
                    </button>
                    <hr className="border-border my-1" />
                    <button
                      onClick={() => { setShowProjects(true); setShowMenu(false) }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-canvas transition-colors"
                    >
                      My Projects
                    </button>
                    <button
                      onClick={() => { setShowProfile(true); setShowMenu(false) }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-canvas transition-colors"
                    >
                      Profile
                    </button>
                    <hr className="border-border my-1" />
                    <a
                      href="?page=gallery"
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-canvas transition-colors text-ink"
                      onClick={() => setShowMenu(false)}
                    >
                      Gallery
                    </a>
                    <a
                      href="?page=about"
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-canvas transition-colors text-ink"
                      onClick={() => setShowMenu(false)}
                    >
                      About
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <span className="text-sm text-paper/50 hidden sm:inline font-light">
              Visualize Indonesia, Province by Province
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {supabase && !loading && (
            user ? (
              <>
                <span className="text-xs text-paper/60 hidden sm:inline">{displayName}</span>
                <button
                  onClick={signOut}
                  className="text-sm text-paper/80 hover:text-paper transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <a href="?page=gallery" className="text-sm text-paper/80 hover:text-paper transition-colors hidden sm:inline">Gallery</a>
                <a href="?page=about" className="text-sm text-paper/80 hover:text-paper transition-colors hidden sm:inline">About</a>
                <button
                  onClick={() => setShowAuth(true)}
                  className="text-sm text-paper/80 hover:text-paper transition-colors"
                >
                  Sign In
                </button>
              </>
            )
          )}
        </div>
      </header>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showProjects && <ProjectsPanel onClose={() => setShowProjects(false)} />}
      {showSaveAs && <SaveAsDialog onSave={handleSaveAs} onCancel={() => setShowSaveAs(false)} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  )
}
