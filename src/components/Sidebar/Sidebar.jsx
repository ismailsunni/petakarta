import useMapStore from '../../store/mapStore'
import DataTab from './DataTab'
import StyleTab from './StyleTab'
import ExportTab from './ExportTab'
import DatasetsTab from '../Datasets/DatasetsTab'

const TABS = [
  { key: 'data', label: 'Data' },
  { key: 'datasets', label: 'Datasets' },
  { key: 'style', label: 'Style' },
  { key: 'export', label: 'Export' },
]

export default function Sidebar() {
  const activeTab = useMapStore((s) => s.activeTab)
  const update = useMapStore((s) => s.update)

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
        {activeTab === 'data' && <DataTab />}
        {activeTab === 'datasets' && <DatasetsTab />}
        {activeTab === 'style' && <StyleTab />}
        {activeTab === 'export' && <ExportTab />}
      </div>
    </aside>
  )
}
