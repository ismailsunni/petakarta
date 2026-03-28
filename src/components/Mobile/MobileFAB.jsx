import useLayerTreeStore from '../../store/layerTreeStore'

const TAB_LABELS = { layers: 'Layers', style: 'Style', map: 'Map' }

export default function MobileFAB({ onClick }) {
  const activeTab = useLayerTreeStore((s) => s.activeTab)

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 md:hidden flex items-center gap-2 bg-accent text-paper rounded-full px-5 h-14 shadow-lg hover:bg-accent/90 active:scale-95 transition-all duration-150"
      aria-label="Open editor"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="17" y2="6" />
        <line x1="3" y1="10" x2="17" y2="10" />
        <line x1="3" y1="14" x2="17" y2="14" />
      </svg>
      <span className="text-sm font-medium">{TAB_LABELS[activeTab] ?? 'Edit'}</span>
    </button>
  )
}
