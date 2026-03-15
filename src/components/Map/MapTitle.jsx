import useLayerTreeStore from '../../store/layerTreeStore'

export default function MapTitle() {
  const mapTitle = useLayerTreeStore((s) => s.mapTitle)

  if (!mapTitle) return null

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
      <h2 className="text-lg font-semibold text-ink bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-lg shadow-sm whitespace-nowrap">
        {mapTitle}
      </h2>
    </div>
  )
}
