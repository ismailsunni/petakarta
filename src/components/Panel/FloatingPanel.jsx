import useLayerTreeStore from '../../store/layerTreeStore'
import LayerTreePanel from '../Layers/LayerTreePanel'
import StyleTab from '../Sidebar/StyleTab'
import MapTab from '../Sidebar/MapTab'
import ShareTab from '../Sidebar/ShareTab'

function LayersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 6l7-4 7 4-7 4-7-4z" />
      <path d="M1 10l7 4 7-4" />
    </svg>
  )
}

function StyleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.5 2l2.5 2.5-7 7H4.5V9l7-7z" />
      <path d="M3 14c0-.8.7-1.5 1.5-1.5S6 13.2 6 14" />
    </svg>
  )
}

function MapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M2 8h12" />
      <path d="M8 2c-2 1.5-2 8.5 0 12" />
      <path d="M8 2c2 1.5 2 8.5 0 12" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="3" r="1.5" />
      <circle cx="12" cy="13" r="1.5" />
      <circle cx="4" cy="8" r="1.5" />
      <path d="M5.5 7.2l5-2.9M5.5 8.8l5 2.9" />
    </svg>
  )
}

const TABS = [
  { key: 'layers', label: 'Layers', Icon: LayersIcon },
  { key: 'style', label: 'Style', Icon: StyleIcon },
  { key: 'map', label: 'Map', Icon: MapIcon },
  { key: 'share', label: 'Share', Icon: ShareIcon },
]

function TabContent({ activeTab }) {
  return (
    <>
      {activeTab === 'layers' && <LayerTreePanel />}
      {activeTab === 'style' && <StyleTab />}
      {activeTab === 'map' && <MapTab />}
      {activeTab === 'share' && <ShareTab />}
    </>
  )
}

export default function FloatingPanel() {
  const activeTab = useLayerTreeStore((s) => s.activeTab)
  const panelExpanded = useLayerTreeStore((s) => s.panelExpanded)
  const update = useLayerTreeStore((s) => s.update)

  const handleTabClick = (tabKey) => {
    if (panelExpanded && activeTab === tabKey) {
      update({ panelExpanded: false })
    } else {
      update({ activeTab: tabKey, panelExpanded: true })
    }
  }

  const collapse = () => update({ panelExpanded: false })

  const activeTabLabel = TABS.find((t) => t.key === activeTab)?.label ?? ''

  const tabBtnClass = (tabKey) =>
    `w-10 h-10 flex items-center justify-center rounded transition-colors ${
      panelExpanded && activeTab === tabKey
        ? 'bg-accent/10 text-accent'
        : 'text-muted hover:text-ink hover:bg-canvas'
    }`

  const mobileBtnClass = (tabKey) =>
    `flex flex-col items-center gap-0.5 px-3 py-1 rounded transition-colors ${
      panelExpanded && activeTab === tabKey ? 'text-accent' : 'text-muted hover:text-ink'
    }`

  return (
    <>
      {/* ── Desktop: vertical toolbar on left, panel expands right ── */}
      <div className="hidden md:flex absolute top-0 left-0 bottom-0 z-20 flex-row">
        {/* Icon toolbar */}
        <div className="w-12 bg-paper/95 backdrop-blur-sm border-r border-border flex flex-col py-2 gap-1 items-center">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => handleTabClick(key)}
              className={tabBtnClass(key)}
              title={label}
            >
              <Icon />
            </button>
          ))}
        </div>

        {/* Expandable panel */}
        <div
          className="bg-paper/95 backdrop-blur-sm border-r border-border shadow-xl overflow-hidden transition-all duration-200"
          style={{ width: panelExpanded ? 320 : 0 }}
        >
          <div className="w-[320px] h-full flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="text-sm font-medium">{activeTabLabel}</h3>
              <button
                onClick={collapse}
                className="text-muted hover:text-ink transition-colors text-xl leading-none"
                aria-label="Close panel"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <TabContent activeTab={activeTab} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile: horizontal toolbar at bottom, panel expands upward ── */}
      <div className="flex md:hidden fixed bottom-0 left-0 right-0 z-20 flex-col-reverse">
        {/* Backdrop */}
        {panelExpanded && (
          <div
            className="fixed inset-0 z-[-1] bg-ink/30"
            onClick={collapse}
          />
        )}

        {/* Icon toolbar */}
        <div className="h-12 bg-paper/95 backdrop-blur-sm border-t border-border flex flex-row justify-around items-center px-2 shrink-0">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => handleTabClick(key)}
              className={mobileBtnClass(key)}
              title={label}
            >
              <Icon />
              <span className="text-[9px]">{label}</span>
            </button>
          ))}
        </div>

        {/* Panel slides up */}
        <div
          className="bg-paper/95 backdrop-blur-sm border-t border-border shadow-xl overflow-hidden transition-all duration-200"
          style={{ height: panelExpanded ? '60vh' : 0 }}
        >
          <div className="flex flex-col" style={{ height: '60vh' }}>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="text-sm font-medium">{activeTabLabel}</h3>
              <button
                onClick={collapse}
                className="text-muted hover:text-ink transition-colors text-xl leading-none"
                aria-label="Close panel"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <TabContent activeTab={activeTab} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
