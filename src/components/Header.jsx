import { useCallback, useEffect, useRef, useState } from 'react'
import useAuthStore from '../store/authStore'
import useMapStore from '../store/mapStore'
import { supabase } from '../lib/supabase'
import AuthModal from './Auth/AuthModal'
import ProjectsPanel from './Projects/ProjectsPanel'
import {
  extractProjectState,
  saveProject,
  updateProject,
} from '../lib/projectsService'

function SaveAsDialog({ onSave, onCancel }) {
  const [name, setName] = useState('')
  const [isPublic, setIsPublic] = useState(false)

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
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onSave(name.trim(), isPublic)}
          autoFocus
          className="w-full rounded border border-border bg-canvas px-3 py-1.5 text-sm mb-3"
        />
        <label className="flex items-center gap-2 text-sm text-ink mb-4 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="accent-accent"
          />
          Make public (shareable via link)
        </label>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="text-sm text-muted hover:text-ink transition-colors px-2 py-1">
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onSave(name.trim(), isPublic)}
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
  const loading = useAuthStore((s) => s.loading)
  const signOut = useAuthStore((s) => s.signOut)
  const activeProjectId = useMapStore((s) => s.activeProjectId)
  const activeProjectName = useMapStore((s) => s.activeProjectName)
  const activeProjectPublic = useMapStore((s) => s.activeProjectPublic)
  const [showAuth, setShowAuth] = useState(false)
  const [showProjects, setShowProjects] = useState(false)
  const [showSaveAs, setShowSaveAs] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
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

  const handleSave = useCallback(async () => {
    if (!user) return
    setSaving(true)
    if (activeProjectId) {
      const state = extractProjectState(useMapStore.getState())
      await updateProject(activeProjectId, { state_json: state })
    } else {
      setShowSaveAs(true)
    }
    setSaving(false)
  }, [user, activeProjectId])

  const handleSaveAs = useCallback(async (name, isPublic) => {
    if (!user) return
    setSaving(true)
    const state = extractProjectState(useMapStore.getState())
    const { data } = await saveProject(user.id, name, state, isPublic)
    if (data) {
      useMapStore.getState().setActiveProjectId(data.id)
      useMapStore.getState().setActiveProjectName(data.name)
      useMapStore.getState().setActiveProjectPublic(data.is_public ?? false)
    }
    setSaving(false)
    setShowSaveAs(false)
  }, [user])

  const handleTogglePublic = useCallback(async () => {
    if (!activeProjectId) return
    const next = !activeProjectPublic
    await updateProject(activeProjectId, { is_public: next })
    useMapStore.getState().setActiveProjectPublic(next)
  }, [activeProjectId, activeProjectPublic])

  const handleRenameSubmit = useCallback(async () => {
    const trimmed = renameValue.trim()
    if (!trimmed || !activeProjectId || trimmed === activeProjectName) {
      setRenaming(false)
      return
    }
    await updateProject(activeProjectId, { name: trimmed })
    useMapStore.getState().setActiveProjectName(trimmed)
    setRenaming(false)
  }, [renameValue, activeProjectId, activeProjectName])

  const handleNewProject = useCallback(() => {
    useMapStore.getState().resetData()
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

  return (
    <>
      <header className="h-[52px] bg-ink text-paper flex items-center justify-between px-5 shrink-0 border-b border-ink/20">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl tracking-tight">PetaKarta</h1>
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
                <button
                  onClick={handleTogglePublic}
                  title={activeProjectPublic ? 'Public — click to make private' : 'Private — click to make public'}
                  className="text-paper/60 hover:text-paper transition-colors text-base leading-none"
                >
                  {activeProjectPublic ? '🌐' : '🔒'}
                </button>
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
                <span className="text-xs text-paper/60 hidden sm:inline">{user.email}</span>
                <button
                  onClick={signOut}
                  className="text-sm text-paper/80 hover:text-paper transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="text-sm text-paper/80 hover:text-paper transition-colors"
              >
                Sign In
              </button>
            )
          )}
          <a
            href="https://github.com/ismailsunni/petakarta"
            target="_blank"
            rel="noopener noreferrer"
            className="text-paper/70 hover:text-paper transition-colors"
            aria-label="GitHub repository"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </a>
        </div>
      </header>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showProjects && <ProjectsPanel onClose={() => setShowProjects(false)} />}
      {showSaveAs && <SaveAsDialog onSave={handleSaveAs} onCancel={() => setShowSaveAs(false)} />}
    </>
  )
}
