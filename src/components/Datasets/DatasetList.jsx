import { useCallback, useState, useEffect } from 'react'
import useDatasetsStore from '../../store/datasetsStore'
import useAuthStore from '../../store/authStore'

export default function DatasetList() {
  const user = useAuthStore((s) => s.user)
  const datasets = useDatasetsStore((s) => s.datasets)
  const userLayers = useDatasetsStore((s) => s.userLayers)
  const datasetsLoading = useDatasetsStore((s) => s.datasetsLoading)
  const datasetsError = useDatasetsStore((s) => s.datasetsError)
  const loadDatasets = useDatasetsStore((s) => s.loadDatasets)
  const addLayerFromDataset = useDatasetsStore((s) => s.addLayerFromDataset)
  const renameDataset = useDatasetsStore((s) => s.renameDataset)
  const deleteDataset = useDatasetsStore((s) => s.deleteDataset)

  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    if (user) {
      loadDatasets(user.id)
    }
  }, [user, loadDatasets])

  const handleStartEdit = useCallback((dataset) => {
    setEditingId(dataset.id)
    setEditName(dataset.name)
    setActionError(null)
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editName.trim()) return
    const { error } = await renameDataset(editingId, editName.trim())
    if (error) {
      setActionError(error.message)
    } else {
      setEditingId(null)
      setEditName('')
    }
  }, [editingId, editName, renameDataset])

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditName('')
    setActionError(null)
  }, [])

  const handleDelete = useCallback(async (dataset) => {
    setDeletingId(dataset.id)
    setActionError(null)
    const { error } = await deleteDataset(dataset.id, dataset.storage_path)
    if (error) {
      setActionError(error.message)
    }
    setDeletingId(null)
  }, [deleteDataset])

  const handleAddToMap = useCallback(async (dataset) => {
    setActionError(null)
    const { error } = await addLayerFromDataset(dataset)
    if (error) {
      setActionError(error.message)
    }
  }, [addLayerFromDataset])

  const isOnMap = useCallback((datasetId) => {
    return userLayers.some((l) => l.datasetId === datasetId)
  }, [userLayers])

  const getGeometryIcon = (type) => {
    const normalized = type?.toLowerCase() || ''
    if (normalized.includes('polygon')) {
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M4 6l6-3 6 3 4 2v10l-4 2-6 3-6-3-4-2V6z" />
        </svg>
      )
    }
    if (normalized.includes('line')) {
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M4 20L20 4" strokeLinecap="round" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="4" />
      </svg>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-4 text-sm text-muted">
        Sign in to view your datasets
      </div>
    )
  }

  if (datasetsLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <svg className="animate-spin h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  if (datasetsError) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-600">
        {datasetsError}
      </div>
    )
  }

  if (datasets.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted">
        No datasets uploaded yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {actionError && (
        <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-600 mb-2">
          {actionError}
        </div>
      )}

      {datasets.map((dataset) => {
        const onMap = isOnMap(dataset.id)
        const isEditing = editingId === dataset.id
        const isDeleting = deletingId === dataset.id

        return (
          <div
            key={dataset.id}
            className={`rounded border p-2 transition-colors ${
              onMap ? 'border-accent/30 bg-accent/5' : 'border-border bg-paper'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-muted mt-0.5">{getGeometryIcon(dataset.geometry_type)}</span>

              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 min-w-0 rounded border border-border bg-paper px-1.5 py-0.5 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit()
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="text-accent hover:text-accentMuted text-xs px-1"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-muted hover:text-ink text-xs px-1"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium truncate">{dataset.name}</p>
                    <p className="text-xs text-muted">
                      {dataset.feature_count || '?'} features • {dataset.geometry_type}
                    </p>
                  </>
                )}
              </div>

              {!isEditing && (
                <div className="flex gap-1">
                  {onMap ? (
                    <span className="text-xs text-accent px-1.5 py-0.5 bg-accent/10 rounded">
                      On map
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAddToMap(dataset)}
                      className="text-xs text-accent hover:text-accentMuted px-1.5 py-0.5 border border-accent/30 rounded hover:bg-accent/5 transition-colors"
                    >
                      Add
                    </button>
                  )}
                </div>
              )}
            </div>

            {!isEditing && (
              <div className="flex gap-2 mt-2 pt-2 border-t border-border">
                <button
                  onClick={() => handleStartEdit(dataset)}
                  className="text-xs text-muted hover:text-ink transition-colors"
                >
                  Rename
                </button>
                <button
                  onClick={() => handleDelete(dataset)}
                  disabled={isDeleting}
                  className="text-xs text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
