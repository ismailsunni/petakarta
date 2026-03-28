import useLayerTreeStore from '../../store/layerTreeStore'
import LayerItem from './LayerItem'

export default function LayerTreePanel() {
  const layers = useLayerTreeStore((s) => s.layers)

  // Sort by order descending (top layer first in UI, like QGIS)
  const sortedLayers = [...layers].sort((a, b) => b.order - a.order)

  const openAddTab = () => useLayerTreeStore.setState({ activeTab: 'add', panelExpanded: true })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Layers</h3>
        <button
          onClick={openAddTab}
          className="flex items-center gap-1 text-xs text-accent hover:text-accentMuted transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Layer
        </button>
      </div>

      {/* Layer list */}
      {sortedLayers.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted">
          <p>No layers added yet</p>
          <button
            onClick={openAddTab}
            className="mt-2 text-accent hover:underline"
          >
            Add your first layer
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedLayers.map((layer, index) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              isFirst={index === sortedLayers.length - 1}
              isLast={index === 0}
            />
          ))}
        </div>
      )}

      {/* Legend hint */}
      {sortedLayers.length > 0 && (
        <div className="text-xs text-muted pt-2 border-t border-border">
          <p>Layers on top are drawn last (in front).</p>
        </div>
      )}
    </div>
  )
}
