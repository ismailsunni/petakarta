import { useState, useEffect } from 'react'
import useLayerTreeStore from '../../store/layerTreeStore'
import { useExportContext } from '../../contexts/ExportContext'
import { getLayer } from '../../utils/adminLayers'

export default function MapTab() {
  const exportFnRef = useExportContext()
  const layers = useLayerTreeStore((s) => s.layers)
  const activeProjectId = useLayerTreeStore((s) => s.activeProjectId)
  const activeProjectPublic = useLayerTreeStore((s) => s.activeProjectPublic)
  const mapTitle = useLayerTreeStore((s) => s.mapTitle)
  const legendTitle = useLayerTreeStore((s) => s.legendTitle)
  const attribution = useLayerTreeStore((s) => s.attribution)
  const exportExtent = useLayerTreeStore((s) => s.exportExtent)
  const currentViewExtentVersion = useLayerTreeStore((s) => s.currentViewExtentVersion)
  const update = useLayerTreeStore((s) => s.update)

  const [resolution, setResolution] = useState(2)
  const [copied, setCopied] = useState(false)

  // Local state for text inputs
  const [localMapTitle, setLocalMapTitle] = useState(mapTitle)
  const [localLegendTitle, setLocalLegendTitle] = useState(legendTitle)
  const [localAttribution, setLocalAttribution] = useState(attribution)

  useEffect(() => { setLocalMapTitle(mapTitle) }, [mapTitle])
  useEffect(() => { setLocalLegendTitle(legendTitle) }, [legendTitle])
  useEffect(() => { setLocalAttribution(attribution) }, [attribution])

  // Get layers with extents for dropdown
  const layersWithExtent = layers.filter((l) => {
    if (l.type === 'admin') {
      const layerConfig = getLayer(l.adminConfig?.adminLayerId)
      return layerConfig?.bbox
    }
    return l.userConfig?.bbox
  })

  const handleExport = () => {
    exportFnRef.current?.(resolution)
  }

  const canShare = activeProjectId && activeProjectPublic
  const shareUrl = canShare
    ? `${window.location.origin}${import.meta.env.BASE_URL}?project=${activeProjectId}`
    : null

  const handleCopyLink = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = (platform) => {
    if (!shareUrl) return
    const text = 'Check out this map made with PetaKarta!'
    const encoded = encodeURIComponent(shareUrl)
    const encodedText = encodeURIComponent(text)
    let url
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encoded}`
        break
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encoded}`
        break
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`
        break
    }
    if (url) window.open(url, '_blank', 'width=600,height=400')
  }

  const handleNativeShare = async () => {
    if (!shareUrl || !navigator.share) return
    try {
      await navigator.share({
        title: 'PetaKarta Map',
        text: 'Check out this map made with PetaKarta!',
        url: shareUrl,
      })
    } catch {
      // User cancelled or share failed
    }
  }

  return (
    <div className="space-y-4">
      {/* Labels Section */}
      <div>
        <h3 className="text-sm font-medium mb-2">Labels</h3>
        <div className="space-y-2">
          <label className="block">
            <span className="text-xs text-muted">Map title</span>
            <input
              type="text"
              value={localMapTitle}
              onChange={(e) => setLocalMapTitle(e.target.value)}
              onBlur={() => update({ mapTitle: localMapTitle })}
              onKeyDown={(e) => e.key === 'Enter' && update({ mapTitle: localMapTitle })}
              placeholder="e.g. GDP per Capita 2023"
              className="mt-1 block w-full rounded border border-border bg-paper px-2 py-1 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted">Legend title</span>
            <input
              type="text"
              value={localLegendTitle}
              onChange={(e) => setLocalLegendTitle(e.target.value)}
              onBlur={() => update({ legendTitle: localLegendTitle })}
              onKeyDown={(e) => e.key === 'Enter' && update({ legendTitle: localLegendTitle })}
              placeholder="e.g. Million IDR"
              className="mt-1 block w-full rounded border border-border bg-paper px-2 py-1 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted">Attribution / Source</span>
            <input
              type="text"
              value={localAttribution}
              onChange={(e) => setLocalAttribution(e.target.value)}
              onBlur={() => update({ attribution: localAttribution })}
              onKeyDown={(e) => e.key === 'Enter' && update({ attribution: localAttribution })}
              placeholder="e.g. Source: BPS 2023"
              className="mt-1 block w-full rounded border border-border bg-paper px-2 py-1 text-sm"
            />
          </label>
        </div>
      </div>

      {/* Extent Section */}
      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-medium mb-2">Map Extent</h3>
        <select
          value={exportExtent}
          onChange={(e) => update({ exportExtent: e.target.value })}
          className="w-full rounded border border-border bg-paper px-2 py-1.5 text-sm"
        >
          <option value="">Current view</option>
          {layersWithExtent.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </select>
        {exportExtent === '' && (
          <button
            onClick={() => update({ currentViewExtentVersion: currentViewExtentVersion + 1 })}
            className="mt-2 w-full bg-ink text-paper py-1.5 rounded text-sm font-medium hover:bg-muted transition-colors"
          >
            Update to Current View
          </button>
        )}
      </div>

      {/* Download Section */}
      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-medium mb-2">Download Map</h3>
        <div>
          <span className="text-xs text-muted">Resolution</span>
          <div className="flex flex-col gap-1 mt-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="resolution"
                value={1}
                checked={resolution === 1}
                onChange={() => setResolution(1)}
              />
              Standard (1x)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="resolution"
                value={2}
                checked={resolution === 2}
                onChange={() => setResolution(2)}
              />
              High-res (2x)
            </label>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="w-full mt-3 bg-accent text-paper py-2 rounded text-sm font-medium hover:bg-accentMuted transition-colors"
        >
          Download PNG
        </button>
      </div>

      {/* Share Section */}
      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-medium mb-2">Share Map</h3>
        {canShare ? (
          <div className="space-y-2">
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 border border-border rounded py-1.5 text-sm hover:bg-canvas transition-colors"
            >
              {copied ? 'Copied!' : 'Copy link'}
            </button>

            {navigator.share && (
              <button
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2 border border-border rounded py-1.5 text-sm hover:bg-canvas transition-colors"
              >
                Share...
              </button>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleShare('twitter')}
                className="flex-1 border border-border rounded py-1.5 text-xs hover:bg-canvas transition-colors"
              >
                X / Twitter
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="flex-1 border border-border rounded py-1.5 text-xs hover:bg-canvas transition-colors"
              >
                Facebook
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="flex-1 border border-border rounded py-1.5 text-xs hover:bg-canvas transition-colors"
              >
                LinkedIn
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted">
            {activeProjectId
              ? 'Make your project public to enable sharing.'
              : 'Save your project and make it public to enable sharing.'}
          </p>
        )}
      </div>
    </div>
  )
}
