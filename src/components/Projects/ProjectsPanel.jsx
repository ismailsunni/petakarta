import { useCallback, useEffect, useState } from 'react'
import useAuthStore from '../../store/authStore'
import useMapStore from '../../store/mapStore'
import {
  listProjects,
  loadProject,
  updateProject,
  deleteProject,
  normalizeProjectState,
} from '../../lib/projectsService'

export default function ProjectsPanel({ onClose }) {
  const user = useAuthStore((s) => s.user)
  const storeActiveId = useMapStore((s) => s.activeProjectId)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  const fetchProjects = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await listProjects(user.id)
    setProjects(data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleLoad = async (id) => {
    setError('')
    const { data, error: loadError } = await loadProject(id)
    if (loadError) {
      setError(loadError.message)
      return
    }
    if (data?.state_json) {
      useMapStore.setState(normalizeProjectState(data.state_json))
      useMapStore.getState().setActiveProjectId(id)
      useMapStore.getState().setActiveProjectName(data.name || '')
      useMapStore.getState().setActiveProjectPublic(data.is_public ?? false)
      onClose()
    }
  }

  const handleDelete = async (id) => {
    setError('')
    const { error: delError } = await deleteProject(id)
    if (delError) {
      setError(delError.message)
    } else {
      if (storeActiveId === id) {
        useMapStore.getState().setActiveProjectId(null)
        useMapStore.getState().setActiveProjectName('')
        useMapStore.getState().setActiveProjectPublic(false)
      }
      fetchProjects()
    }
  }

  const handleTogglePublic = async (project) => {
    setError('')
    const { error: toggleError } = await updateProject(project.id, {
      is_public: !project.is_public,
    })
    if (toggleError) {
      setError(toggleError.message)
    } else {
      if (project.id === storeActiveId) {
        useMapStore.getState().setActiveProjectPublic(!project.is_public)
      }
      fetchProjects()
    }
  }

  const handleRenameSubmit = async (id) => {
    const trimmed = renameValue.trim()
    if (!trimmed) {
      setRenamingId(null)
      return
    }
    const { error: renameError } = await updateProject(id, { name: trimmed })
    if (renameError) {
      setError(renameError.message)
    } else {
      if (id === storeActiveId) {
        useMapStore.getState().setActiveProjectName(trimmed)
      }
      fetchProjects()
    }
    setRenamingId(null)
  }

  const handleCopyLink = (id) => {
    const base = import.meta.env.BASE_URL
    const url = `${window.location.origin}${base}?project=${id}`
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-paper rounded-lg shadow-lg w-full max-w-md mx-4 p-6 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg mb-4">My Projects</h2>

        {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

        {loading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted">No saved projects yet.</p>
        ) : (
          <ul className="space-y-2">
            {projects.map((p) => (
              <li
                key={p.id}
                className={`rounded border px-3 py-2 text-sm ${
                  p.id === storeActiveId ? 'border-accent bg-accent/5' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    {renamingId === p.id ? (
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => handleRenameSubmit(p.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSubmit(p.id)
                          if (e.key === 'Escape') setRenamingId(null)
                        }}
                        autoFocus
                        className="w-full rounded border border-border bg-canvas px-2 py-0.5 text-sm font-medium"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{p.name}</p>
                        {p.id === storeActiveId && (
                          <span className="text-[10px] bg-accent/15 text-accent px-1.5 py-0.5 rounded font-medium shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted">
                      {new Date(p.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-2">
                    <button
                      onClick={() => handleLoad(p.id)}
                      className="text-xs text-accent hover:underline"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => { setRenameValue(p.name); setRenamingId(p.id) }}
                      className="text-xs text-muted hover:text-ink hover:underline"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-border/50">
                  <button
                    onClick={() => handleTogglePublic(p)}
                    className="flex items-center gap-1 text-xs text-muted hover:text-ink transition-colors"
                    title={p.is_public ? 'Make private' : 'Make public'}
                  >
                    <span>{p.is_public ? '\u{1F310}' : '\u{1F512}'}</span>
                    <span>{p.is_public ? 'Public' : 'Private'}</span>
                  </button>
                  {p.is_public && (
                    <button
                      onClick={() => handleCopyLink(p.id)}
                      className="text-xs text-accent hover:underline"
                    >
                      {copied === p.id ? 'Copied!' : 'Copy share link'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={onClose}
          className="mt-4 text-sm text-muted hover:text-ink transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  )
}
