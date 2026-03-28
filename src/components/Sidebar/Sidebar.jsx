import useLayerTreeStore from '../../store/layerTreeStore'
import LayerTreePanel from '../Layers/LayerTreePanel'
import StyleTab from './StyleTab'
import MapTab from './MapTab'
import ShareTab from './ShareTab'

const TABS = [
  { key: 'layers', label: 'Layers' },
  { key: 'style', label: 'Style' },
  { key: 'map', label: 'Map' },
  { key: 'share', label: 'Share' },
]

export default function Sidebar() {
  const activeTab = useLayerTreeStore((s) => s.activeTab)
  const update = useLayerTreeStore((s) => s.update)

  return (
    <aside className="w-80 bg-paper border-r border-border flex flex-col shrink-0 hidden md:flex">
      <div className="flex border-b border-border">
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
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'layers' && <LayerTreePanel />}
        {activeTab === 'style' && <StyleTab />}
        {activeTab === 'map' && <MapTab />}
        {activeTab === 'share' && <ShareTab />}
      </div>
    </aside>
  )
}
