import { useState } from 'react'
import useLayerTreeStore from '../../store/layerTreeStore'
import { useExportContext } from '../../contexts/ExportContext'
import { DPI_PRESETS } from '../../utils/exportUtils'

export default function ExportTab() {
  const exportFnRef = useExportContext()
  const activeProjectId = useLayerTreeStore((s) => s.activeProjectId)
  const activeProjectPublic = useLayerTreeStore((s) => s.activeProjectPublic)
  const [dpi, setDpi] = useState(144)
  const [copied, setCopied] = useState(false)

  const handleExport = () => {
    exportFnRef?.current?.(dpi)
  }

  const selectedPreset = DPI_PRESETS.find((p) => p.value === dpi) ?? DPI_PRESETS[1]

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
      <h3 className="text-sm font-medium">Download Map</h3>

      <div>
        <span className="text-xs text-muted">Export quality</span>
        <select
          value={dpi}
          onChange={(e) => setDpi(Number(e.target.value))}
          className="mt-1 w-full rounded border border-border bg-paper px-2 py-1.5 text-sm"
        >
          {DPI_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <p className="text-xs text-muted mt-1">Estimated size: {selectedPreset.hint}</p>
      </div>

      <button
        onClick={handleExport}
        className="w-full bg-accent text-paper py-2 rounded text-sm font-medium hover:bg-accentMuted transition-colors"
      >
        Download PNG
      </button>

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
