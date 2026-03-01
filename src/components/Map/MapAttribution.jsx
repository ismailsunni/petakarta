import useMapStore from '../../store/mapStore'

export default function MapAttribution() {
  const attribution = useMapStore((s) => s.attribution)

  if (!attribution) return null

  return (
    <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
      <span className="text-xs text-muted bg-white/80 backdrop-blur-sm px-2 py-1 rounded shadow-sm">
        {attribution}
      </span>
    </div>
  )
}
