import useLayerTreeStore from '../../store/layerTreeStore'

export default function MapAttribution() {
  const attribution = useLayerTreeStore((s) => s.attribution)
  const panelExpanded = useLayerTreeStore((s) => s.panelExpanded)
  const showAttribution = useLayerTreeStore((s) => s.showAttribution)

  if (!attribution || showAttribution === false) return null

  const leftClass = panelExpanded ? 'left-[340px]' : 'left-3'

  return (
    <div className={`absolute bottom-3 ${leftClass} z-10 pointer-events-none transition-all duration-200`}>
      <span className="text-xs text-muted bg-white/80 backdrop-blur-sm px-2 py-1 rounded shadow-sm">
        {attribution}
      </span>
    </div>
  )
}
