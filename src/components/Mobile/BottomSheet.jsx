import useLayerTreeStore from '../../store/layerTreeStore'
import LayerTreePanel from '../Layers/LayerTreePanel'
import StyleTab from '../Sidebar/StyleTab'
import MapTab from '../Sidebar/MapTab'

const TABS = [
  { key: 'layers', label: 'Layers' },
  { key: 'style', label: 'Style' },
  { key: 'map', label: 'Map' },
]

export default function BottomSheet({ open, onClose }) {
  const activeTab = useLayerTreeStore((s) => s.activeTab)
  const update = useLayerTreeStore((s) => s.update)

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 md:hidden bg-paper rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: '70vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Tab bar + close button */}
        <div className="flex items-center border-b border-border shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => update({ activeTab: tab.key })}
              className={`flex-1 py-2.5 text-sm font-medium transition-all duration-150 ${
                activeTab === tab.key
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-muted hover:text-ink border-b-2 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-muted hover:text-ink transition-colors"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="16" y2="16" />
              <line x1="16" y1="2" x2="2" y2="16" />
            </svg>
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'layers' && <LayerTreePanel />}
          {activeTab === 'style' && <StyleTab />}
          {activeTab === 'map' && <MapTab />}
        </div>
      </div>
    </>
  )
}
