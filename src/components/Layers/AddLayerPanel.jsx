import { useState, useEffect, useCallback } from 'react'
import useLayerTreeStore from '../../store/layerTreeStore'
import useAuthStore from '../../store/authStore'
import { ADMIN_LAYERS } from '../../utils/adminLayers'
import { CATALOG_LAYERS, CATALOG_CATEGORIES } from '../../data/catalogLayers'
import { downloadDataset, fetchUserDatasets, uploadDataset } from '../../lib/datasetsService'
import UsageIndicator from '../UI/UsageIndicator'

const DATASET_LIMIT = 10

export default function AddLayerPanel() {
  const [activeTab, setActiveTab] = useState('admin')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const addAdminLayer = useLayerTreeStore((s) => s.addAdminLayer)
  const addUserLayer = useLayerTreeStore((s) => s.addUserLayer)
  const addLocalGeoJsonLayer = useLayerTreeStore((s) => s.addLocalGeoJsonLayer)
  const addCatalogLayer = useLayerTreeStore((s) => s.addCatalogLayer)
  const addRemoteGeoJsonLayer = useLayerTreeStore((s) => s.addRemoteGeoJsonLayer)
  const existingLayers = useLayerTreeStore((s) => s.layers)

  const user = useAuthStore((s) => s.user)
  const [datasets, setDatasets] = useState([])
  const [datasetsLoading, setDatasetsLoading] = useState(false)

  // Catalog tab state
  const [catalogSearch, setCatalogSearch] = useState('')

  // Custom URL tab state
  const [customType, setCustomType] = useState('xyz')
  const [customUrl, setCustomUrl] = useState('')
  const [customLayerName, setCustomLayerName] = useState('')
  const [customDisplayName, setCustomDisplayName] = useState('')
  const [customAttribution, setCustomAttribution] = useState('')
  const [customError, setCustomError] = useState(null)

  const switchToLayers = () => useLayerTreeStore.setState({ activeTab: 'layers' })

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

  // Filter catalog layers by search
  const filteredCatalogLayers = CATALOG_LAYERS.filter((layer) => {
    if (!catalogSearch) return true
    const q = catalogSearch.toLowerCase()
    return (
      layer.name.toLowerCase().includes(q) ||
      layer.provider.toLowerCase().includes(q)
    )
  })

  // Group catalog layers by category
  const groupedCatalogLayers = filteredCatalogLayers.reduce((acc, layer) => {
    const cat = layer.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(layer)
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

  // Check if catalog layer is already added
  const isCatalogLayerAdded = useCallback((catalogId) => {
    return existingLayers.some(l =>
      l.type === 'catalog' && l.catalogConfig?.catalogId === catalogId
    )
  }, [existingLayers])

  const handleAddAdminLayer = useCallback((adminLayerId) => {
    setError(null)
    const result = addAdminLayer(adminLayerId)
    if (result.error) {
      setError(result.error.message)
    } else {
      switchToLayers()
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
      } else {
        switchToLayers()
      }
    } catch (err) {
      setError(err.message || 'Failed to add dataset')
    }

    setLoading(false)
  }, [addUserLayer])

  const handleAddCatalogLayer = useCallback((entry) => {
    setError(null)
    const result = addCatalogLayer(entry)
    if (result.error) {
      setError(result.error.message)
    } else {
      switchToLayers()
    }
  }, [addCatalogLayer])

  const handleAddCustomLayer = useCallback(async () => {
    setCustomError(null)

    if (customType === 'geojson') {
      if (!customUrl.trim()) {
        setCustomError('URL is required')
        return
      }
      setLoading(true)
      const result = await addRemoteGeoJsonLayer(
        customDisplayName.trim() || 'Remote GeoJSON',
        customUrl.trim()
      )
      setLoading(false)
      if (result.error) {
        setCustomError(result.error.message)
      } else {
        setCustomUrl('')
        setCustomDisplayName('')
        switchToLayers()
      }
      return
    }

    // Validate tile/WMS
    if (customType === 'xyz') {
      if (!customUrl.includes('{z}') || !customUrl.includes('{x}') || !customUrl.includes('{y}')) {
        setCustomError('XYZ URL must contain {z}, {x}, and {y} placeholders')
        return
      }
    } else if (customType === 'wms') {
      if (!customUrl.trim()) {
        setCustomError('URL is required')
        return
      }
      if (!customLayerName.trim()) {
        setCustomError('Layer name is required for WMS')
        return
      }
    }

    const customId = `custom-${Date.now()}`
    const entry = {
      id: customId,
      name: customDisplayName.trim() || (customType === 'wms' ? customLayerName : 'Custom Layer'),
      provider: 'Custom',
      category: 'Custom',
      type: customType,
      url: customUrl.trim(),
      layers: customLayerName.trim(),
      format: customType === 'wms' ? 'image/png' : 'image/png',
      attribution: customAttribution.trim(),
      bbox: null,
      cors: true,
    }

    const result = addCatalogLayer(entry)
    if (result.error) {
      setCustomError(result.error.message)
    } else {
      // Reset form
      setCustomUrl('')
      setCustomLayerName('')
      setCustomDisplayName('')
      setCustomAttribution('')
      switchToLayers()
    }
  }, [addCatalogLayer, addRemoteGeoJsonLayer, customType, customUrl, customLayerName, customDisplayName, customAttribution])

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs */}
      <div className="flex border-b border-border overflow-x-auto scrollbar-hide shrink-0">
        {[
          { id: 'admin', label: 'Admin', icon: '🗺️' },
          { id: 'datasets', label: 'Data', icon: '📁' },
          { id: 'catalog', label: 'Catalog', icon: '📚' },
          { id: 'custom', label: 'URL', icon: '🔗' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setError(null) }}
            className={`flex-1 min-w-0 py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap px-2 ${
              activeTab === tab.id
                ? 'text-accent border-b-2 border-accent'
                : 'text-muted hover:text-ink'
            }`}
          >
            <span className="sm:hidden">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.icon} {tab.label}</span>
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-0 mt-3 p-2 rounded bg-red-50 border border-red-200 text-xs text-red-600 shrink-0">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto pt-4">
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
            {/* Local file upload — works without auth */}
            <div>
              <h4 className="text-xs font-medium text-muted mb-1">Add from file (no sign-in needed)</h4>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg py-3 cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-colors">
                <svg className="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
                <span className="text-sm text-muted">Load GeoJSON file</span>
                <input
                  type="file"
                  accept=".geojson,.json,application/geo+json,application/json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setLoading(true)
                    setError('')
                    try {
                      const text = await file.text()
                      const geojson = JSON.parse(text)
                      const name = file.name.replace(/\.(geo)?json$/i, '')
                      const result = addLocalGeoJsonLayer(name, geojson)
                      if (result?.error) {
                        setError(result.error.message)
                      } else {
                        switchToLayers()
                      }
                    } catch (err) {
                      setError('Invalid GeoJSON file: ' + err.message)
                    }
                    setLoading(false)
                    e.target.value = ''
                  }}
                />
              </label>
              <p className="text-[10px] text-muted mt-1">Stored in your browser only. Max ~5 MB.</p>
            </div>

            {/* Cloud datasets — requires auth */}
            {user && !datasetsLoading && (
              <div className="space-y-2 border-t border-border pt-3">
                <h4 className="text-xs font-medium text-muted">Cloud datasets</h4>
                <UsageIndicator current={datasets.length} max={DATASET_LIMIT} label="datasets" />
                {datasets.length >= DATASET_LIMIT ? (
                  <p className="text-xs text-red-600">Limit reached. Delete a dataset to upload more.</p>
                ) : (
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg py-3 cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-colors">
                    <svg className="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
                    <span className="text-sm text-muted">Upload to cloud</span>
                    <input
                      type="file"
                      accept=".geojson,.json,application/geo+json,application/json"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file || !user) return
                        setLoading(true)
                        setError('')
                        const { data, error: upErr } = await uploadDataset(file, user.id)
                        if (upErr) {
                          setError(upErr.message)
                          setLoading(false)
                          return
                        }
                        // Add to datasets list and add to map
                        setDatasets(prev => [data, ...prev])
                        const result = addUserLayer(data, data.geojson)
                        if (result?.error) {
                          setError(result.error.message)
                        } else {
                          switchToLayers()
                        }
                        setLoading(false)
                        e.target.value = ''
                      }}
                    />
                  </label>
                )}
              </div>
            )}
            {!user ? (
              <p className="text-center text-sm text-muted py-4">
                Sign in to save datasets to the cloud
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
                No cloud datasets yet.
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

        {activeTab === 'catalog' && (
          <div className="space-y-4">
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Search by name or provider..."
              className="w-full rounded border border-border bg-paper px-3 py-2 text-sm placeholder:text-muted/60"
            />

            {CATALOG_CATEGORIES.filter(cat =>
              groupedCatalogLayers[cat]?.length > 0
            ).map((category) => (
              <div key={category}>
                <h4 className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
                  {category}
                </h4>
                <div className="space-y-1">
                  {groupedCatalogLayers[category].map((entry) => {
                    const isAdded = isCatalogLayerAdded(entry.id)
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between p-2 rounded border ${
                          isAdded
                            ? 'border-accent/30 bg-accent/5 opacity-60'
                            : 'border-border hover:border-accent/50'
                        }`}
                      >
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="text-sm font-medium truncate">{entry.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs text-muted bg-canvas px-1.5 py-0.5 rounded">
                              {entry.provider}
                            </span>
                            <span className="text-xs text-muted bg-canvas px-1.5 py-0.5 rounded uppercase">
                              {entry.type}
                            </span>
                          </div>
                        </div>
                        {isAdded ? (
                          <span className="text-xs text-accent px-2 py-0.5 bg-accent/10 rounded shrink-0">
                            Added
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddCatalogLayer(entry)}
                            className="text-xs text-accent hover:text-accentMuted px-2 py-0.5 border border-accent/30 rounded hover:bg-accent/5 transition-colors shrink-0"
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

            {filteredCatalogLayers.length === 0 && (
              <p className="text-center text-sm text-muted py-4">
                No catalog layers match your search
              </p>
            )}
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="space-y-4">
            {customError && (
              <div className="p-2 rounded bg-red-50 border border-red-200 text-xs text-red-600">
                {customError}
              </div>
            )}

            {/* Type select */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Type</label>
              <select
                value={customType}
                onChange={(e) => { setCustomType(e.target.value); setCustomError(null) }}
                className="w-full rounded border border-border bg-paper px-3 py-2 text-sm"
              >
                <option value="xyz">XYZ Tile</option>
                <option value="wms">WMS</option>
                <option value="geojson">GeoJSON</option>
              </select>
            </div>

            {/* URL input */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1">URL</label>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder={
                  customType === 'xyz'
                    ? 'https://example.com/tiles/{z}/{x}/{y}.png'
                    : customType === 'geojson'
                      ? 'https://example.com/data.geojson'
                      : 'https://example.com/wms'
                }
                className="w-full rounded border border-border bg-paper px-3 py-2 text-sm placeholder:text-muted/60"
              />
              {customType === 'xyz' && (
                <p className="text-xs text-muted mt-1">Must include {'{z}'}, {'{x}'}, {'{y}'} placeholders</p>
              )}
              {customType === 'geojson' && (
                <p className="text-xs text-muted mt-1">Must return a GeoJSON FeatureCollection or Feature</p>
              )}
            </div>

            {/* WMS layer name */}
            {customType === 'wms' && (
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Layer Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={customLayerName}
                  onChange={(e) => setCustomLayerName(e.target.value)}
                  placeholder="e.g. topp:states"
                  className="w-full rounded border border-border bg-paper px-3 py-2 text-sm placeholder:text-muted/60"
                />
              </div>
            )}

            {/* Display name */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Display Name</label>
              <input
                type="text"
                value={customDisplayName}
                onChange={(e) => setCustomDisplayName(e.target.value)}
                placeholder="My custom layer"
                className="w-full rounded border border-border bg-paper px-3 py-2 text-sm placeholder:text-muted/60"
              />
            </div>

            {/* Attribution (not needed for GeoJSON) */}
            {customType !== 'geojson' && (
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Attribution <span className="text-muted/60">(optional)</span></label>
                <input
                  type="text"
                  value={customAttribution}
                  onChange={(e) => setCustomAttribution(e.target.value)}
                  placeholder="© Data Provider"
                  className="w-full rounded border border-border bg-paper px-3 py-2 text-sm placeholder:text-muted/60"
                />
              </div>
            )}

            <button
              onClick={handleAddCustomLayer}
              className="w-full py-2 text-sm bg-accent text-white rounded hover:bg-accent/90 transition-colors"
            >
              Add Layer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
