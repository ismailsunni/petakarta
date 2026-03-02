import { useCallback, useEffect, useState } from 'react'
import useAuthStore from '../../store/authStore'
import useMapStore from '../../store/mapStore'
import {
  listProjects,
  loadProject,
  saveProject,
  updateProject,
  deleteProject,
  extractProjectState,
  normalizeProjectState,
} from '../../lib/projectsService'

export default function ProjectsPanel({ onClose }) {
  const user = useAuthStore((s) => s.user)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [saveName, setSaveName] = useState('')
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(null)

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

  const handleSave = async () => {
    if (!saveName.trim()) return
    setError('')
    const state = extractProjectState(useMapStore.getState())
    const { error: saveError } = await saveProject(user.id, saveName.trim(), state)
    if (saveError) {
      setError(saveError.message)
    } else {
      setSaveName('')
      fetchProjects()
    }
  }

  const handleUpdate = async () => {
    if (!activeProjectId) return
    setError('')
    const state = extractProjectState(useMapStore.getState())
    const project = projects.find((p) => p.id === activeProjectId)
    const { error: updateError } = await updateProject(activeProjectId, {
      name: project?.name,
      state_json: state,
    })
    if (updateError) {
      setError(updateError.message)
    } else {
      fetchProjects()
    }
  }

  const handleLoad = async (id) => {
    setError('')
    const { data, error: loadError } = await loadProject(id)
    if (loadError) {
      setError(loadError.message)
      return
    }
    if (data?.state_json) {
      useMapStore.setState(normalizeProjectState(data.state_json))
      setActiveProjectId(id)
      useMapStore.getState().setActiveProjectId(id)
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
      if (activeProjectId === id) {
        setActiveProjectId(null)
        useMapStore.getState().setActiveProjectId(null)
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
      if (project.id === activeProjectId) {
        useMapStore.getState().setActiveProjectPublic(!project.is_public)
      }
      fetchProjects()
    }
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

        {/* Save section */}
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Project name..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="flex-1 rounded border border-border bg-canvas px-3 py-1.5 text-sm"
            />
            <button
              onClick={handleSave}
              disabled={!saveName.trim()}
              className="bg-accent text-paper px-3 py-1.5 rounded text-sm font-medium hover:bg-accentMuted transition-colors disabled:opacity-40"
            >
              Save as
            </button>
          </div>
          {activeProjectId && (
            <button
              onClick={handleUpdate}
              className="mt-2 text-sm text-accent hover:underline"
            >
              Update current project
            </button>
          )}
        </div>

        {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

        {/* Project list */}
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
                  p.id === activeProjectId ? 'border-accent bg-accent/5' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
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
