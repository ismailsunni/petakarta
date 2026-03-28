import { useCallback, useEffect, useState } from 'react'
import useAuthStore from '../../store/authStore'
import useLayerTreeStore from '../../store/layerTreeStore'
import {
  listProjects,
  loadProject,
  updateProject,
  deleteProject,
  normalizeProjectState,
} from '../../lib/projectsService'
import UsageIndicator from '../UI/UsageIndicator'

const PROJECT_LIMIT = 20

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private', icon: '🔒' },
  { value: 'unlisted', label: 'Unlisted', icon: '🔗' },
  { value: 'public', label: 'Public', icon: '🌐' },
]

export default function ProjectsPanel({ onClose }) {
  const user = useAuthStore((s) => s.user)
  const storeActiveId = useLayerTreeStore((s) => s.activeProjectId)
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
      const normalized = normalizeProjectState(data.state_json)
      useLayerTreeStore.getState().loadProject(normalized)
      useLayerTreeStore.setState({
        activeProjectId: id,
        activeProjectName: data.name || '',
        activeProjectVisibility: data.visibility ?? (data.is_public ? 'public' : 'private'),
        activeProjectSlug: data.slug ?? null,
      })
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
        useLayerTreeStore.setState({ activeProjectId: null, activeProjectName: '', activeProjectVisibility: 'private' })
      }
      fetchProjects()
    }
  }

  const handleChangeVisibility = async (project, newVisibility) => {
    setError('')
    const { error: updateError } = await updateProject(project.id, {
      visibility: newVisibility,
      is_public: newVisibility === 'public',
    })
    if (updateError) {
      setError(updateError.message)
    } else {
      if (project.id === storeActiveId) {
        useLayerTreeStore.setState({ activeProjectVisibility: newVisibility })
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
        useLayerTreeStore.setState({ activeProjectName: trimmed })
      }
      fetchProjects()
    }
    setRenamingId(null)
  }

  const handleCopyLink = (project) => {
    const base = import.meta.env.BASE_URL
    const url = project.slug
      ? `${window.location.origin}${base}p/${project.slug}`
      : `${window.location.origin}${base}?project=${project.id}`
    navigator.clipboard.writeText(url)
    setCopied(project.id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-paper rounded-lg shadow-lg w-full max-w-md mx-4 p-6 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg mb-4">My Projects</h2>

        {!loading && (
          <div className="mb-3 space-y-1">
            <UsageIndicator current={projects.length} max={PROJECT_LIMIT} label="projects" />
            {projects.length >= PROJECT_LIMIT && (
              <p className="text-xs text-red-600">Project limit reached. Delete a project to create more.</p>
            )}
          </div>
        )}

        {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

        {loading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted">No saved projects yet.</p>
        ) : (
          <ul className="space-y-2">
            {projects.map((p) => {
              const currentVisibility = p.visibility ?? (p.is_public ? 'public' : 'private')
              const visOpt = VISIBILITY_OPTIONS.find((o) => o.value === currentVisibility) ?? VISIBILITY_OPTIONS[0]
              const isShareable = currentVisibility === 'public' || currentVisibility === 'unlisted'
              return (
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
                    <select
                      value={currentVisibility}
                      onChange={(e) => handleChangeVisibility(p, e.target.value)}
                      className="text-xs text-muted bg-transparent border border-border/50 rounded px-1.5 py-0.5 cursor-pointer hover:border-border"
                      title="Change visibility"
                    >
                      {VISIBILITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.icon} {opt.label}
                        </option>
                      ))}
                    </select>
                    {isShareable && (
                      <button
                        onClick={() => handleCopyLink(p)}
                        className="text-xs text-accent hover:underline"
                      >
                        {copied === p.id ? 'Copied!' : 'Copy share link'}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
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
