import { useCallback } from 'react'
import useLayerTreeStore from '../../store/layerTreeStore'
import AddLayerPanel from './AddLayerPanel'

export default function AddLayerModal() {
  const setAddLayerModalOpen = useLayerTreeStore((s) => s.setAddLayerModalOpen)

  const handleClose = useCallback(() => {
    setAddLayerModalOpen(false)
  }, [setAddLayerModalOpen])

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50">
      <div className="bg-paper md:rounded-lg rounded-t-xl shadow-xl w-full md:max-w-lg max-h-[85vh] md:max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-medium">Add Layer</h2>
          <button
            onClick={handleClose}
            className="p-1 text-muted hover:text-ink transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4">
          <AddLayerPanel />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border shrink-0">
          <button
            onClick={handleClose}
            className="w-full py-2 text-sm text-muted hover:text-ink transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
