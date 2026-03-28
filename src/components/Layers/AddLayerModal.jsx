import { useState, useEffect, useCallback } from 'react'
import useLayerTreeStore from '../../store/layerTreeStore'
import useAuthStore from '../../store/authStore'
import { ADMIN_LAYERS } from '../../utils/adminLayers'
import { downloadDataset, fetchUserDatasets } from '../../lib/datasetsService'
import UsageIndicator from '../UI/UsageIndicator'

const DATASET_LIMIT = 10

export default function AddLayerModal() {
  const [activeTab, setActiveTab] = useState('admin')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const setAddLayerModalOpen = useLayerTreeStore((s) => s.setAddLayerModalOpen)
  const addAdminLayer = useLayerTreeStore((s) => s.addAdminLayer)
  const addUserLayer = useLayerTreeStore((s) => s.addUserLayer)
  const existingLayers = useLayerTreeStore((s) => s.layers)

  const user = useAuthStore((s) => s.user)
  const [datasets, setDatasets] = useState([])
  const [datasetsLoading, setDatasetsLoading] = useState(false)

  // Load datasets when switching to My Datasets tab
  useEffect(() => {
    if (activeTab === 'datasets' && user && datasets.length === 0) {
      setDatasetsLoading(true)
      fetchUserDatasets(user.id).then(({ data }) => {
        setDatasets(data || [])
        setDatasetsLoading(false)
      })
    }
  }, [activeTab, user, datasets.length])

  // Filter admin layers by search
  const filteredAdminLayers = ADMIN_LAYERS.filter((layer) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      layer.name.toLowerCase().includes(q) ||
      layer.group?.toLowerCase().includes(q)
    )
  })

  // Group admin layers by group
  const groupedAdminLayers = filteredAdminLayers.reduce((acc, layer) => {
    const group = layer.group || 'Other'
    if (!acc[group]) acc[group] = []
    acc[group].push(layer)
    return acc
  }, {})

  // Check if admin layer is already added
  const isAdminLayerAdded = useCallback((adminLayerId) => {
    return existingLayers.some(l =>
      l.type === 'admin' && l.adminConfig?.adminLayerId === adminLayerId
    )
  }, [existingLayers])

  // Check if dataset is already added
  const isDatasetAdded = useCallback((datasetId) => {
    return existingLayers.some(l =>
      l.type === 'user' && l.userConfig?.datasetId === datasetId
    )
  }, [existingLayers])

  const handleAddAdminLayer = useCallback((adminLayerId) => {
    setError(null)
    const result = addAdminLayer(adminLayerId)
    if (result.error) {
      setError(result.error.message)
    }
  }, [addAdminLayer])

  const handleAddDataset = useCallback(async (dataset) => {
    setError(null)
    setLoading(true)

    try {
      // Download the GeoJSON
      const { data: geojson, error: downloadError } = await downloadDataset(dataset.storage_path)
      if (downloadError) {
        setError(downloadError.message)
        setLoading(false)
        return
      }

      const result = addUserLayer(dataset, geojson)
      if (result.error) {
        setError(result.error.message)
      }
    } catch (err) {
      setError(err.message || 'Failed to add dataset')
    }

    setLoading(false)
  }, [addUserLayer])

  const handleClose = useCallback(() => {
    setAddLayerModalOpen(false)
  }, [setAddLayerModalOpen])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-paper rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-medium">Add Layer</h2>
          <button
            onClick={handleClose}
            className="p-1 text-muted hover:text-ink transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'admin'
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted hover:text-ink'
            }`}
          >
            Admin Layers
          </button>
          <button
            onClick={() => setActiveTab('datasets')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'datasets'
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted hover:text-ink'
            }`}
          >
            My Datasets
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-4 mt-4 p-2 rounded bg-red-50 border border-red-200 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'admin' && (
            <div className="space-y-4">
              {/* Search */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search layers..."
                className="w-full rounded border border-border bg-paper px-3 py-2 text-sm placeholder:text-muted/60"
              />

              {/* Grouped layers */}
              {Object.entries(groupedAdminLayers).map(([group, layers]) => (
                <div key={group}>
                  <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
                    {group}
                  </h4>
                  <div className="space-y-1">
                    {layers.map((layer) => {
                      const isAdded = isAdminLayerAdded(layer.id)
                      return (
                        <div
                          key={layer.id}
                          className={`flex items-center justify-between p-2 rounded border ${
                            isAdded
                              ? 'border-accent/30 bg-accent/5'
                              : 'border-border hover:border-accent/50'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{layer.name}</p>
                          </div>
                          {isAdded ? (
                            <span className="text-xs text-accent px-2 py-0.5 bg-accent/10 rounded">
                              Added
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddAdminLayer(layer.id)}
                              className="text-xs text-accent hover:text-accentMuted px-2 py-0.5 border border-accent/30 rounded hover:bg-accent/5 transition-colors"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {filteredAdminLayers.length === 0 && (
                <p className="text-center text-sm text-muted py-4">
                  No layers match your search
                </p>
              )}
            </div>
          )}

          {activeTab === 'datasets' && (
            <div className="space-y-4">
              {user && !datasetsLoading && (
                <div className="space-y-1">
                  <UsageIndicator current={datasets.length} max={DATASET_LIMIT} label="datasets" />
                  {datasets.length >= DATASET_LIMIT && (
                    <p className="text-xs text-red-600">Limit reached. Delete a dataset to upload more.</p>
                  )}
                </div>
              )}
              {!user ? (
                <p className="text-center text-sm text-muted py-4">
                  Sign in to access your datasets
                </p>
              ) : datasetsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <svg className="animate-spin h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : datasets.length === 0 ? (
                <p className="text-center text-sm text-muted py-4">
                  No datasets uploaded yet. Upload a GeoJSON file to get started.
                </p>
              ) : (
                <div className="space-y-1">
                  {datasets.map((dataset) => {
                    const isAdded = isDatasetAdded(dataset.id)
                    return (
                      <div
                        key={dataset.id}
                        className={`flex items-center justify-between p-2 rounded border ${
                          isAdded
                            ? 'border-accent/30 bg-accent/5'
                            : 'border-border hover:border-accent/50'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{dataset.name}</p>
                          <p className="text-xs text-muted">
                            {dataset.feature_count || '?'} features • {dataset.geometry_type}
                          </p>
                        </div>
                        {isAdded ? (
                          <span className="text-xs text-accent px-2 py-0.5 bg-accent/10 rounded">
                            Added
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddDataset(dataset)}
                            disabled={loading}
                            className="text-xs text-accent hover:text-accentMuted px-2 py-0.5 border border-accent/30 rounded hover:bg-accent/5 transition-colors disabled:opacity-50"
                          >
                            {loading ? 'Loading...' : 'Add'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleClose}
            className="w-full py-2 text-sm text-muted hover:text-ink transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
