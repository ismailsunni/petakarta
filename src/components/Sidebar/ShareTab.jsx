import { useState } from 'react'
import useLayerTreeStore from '../../store/layerTreeStore'

export default function ShareTab() {
  const activeProjectId = useLayerTreeStore((s) => s.activeProjectId)
  const activeProjectSlug = useLayerTreeStore((s) => s.activeProjectSlug)
  const activeProjectVisibility = useLayerTreeStore((s) => s.activeProjectVisibility)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)
  const [embedWidth, setEmbedWidth] = useState(800)
  const [embedHeight, setEmbedHeight] = useState(600)

  const isShareable =
    activeProjectId &&
    (activeProjectVisibility === 'unlisted' || activeProjectVisibility === 'public')

  if (!isShareable) {
    return (
      <p className="text-sm text-muted py-2">
        Save your project and set visibility to Unlisted or Public to share it.
      </p>
    )
  }

  const base = import.meta.env.BASE_URL
  const origin = window.location.origin
  const shareUrl = activeProjectSlug
    ? `${origin}${base}p/${activeProjectSlug}`
    : `${origin}${base}?project=${activeProjectId}`
  const embedCode = `<iframe src="${shareUrl}?embed=true" width="${embedWidth}" height="${embedHeight}" frameborder="0"></iframe>`

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode)
    setCopiedEmbed(true)
    setTimeout(() => setCopiedEmbed(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Share URL */}
      <div>
        <h3 className="text-sm font-medium mb-2">Share URL</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 min-w-0 rounded border border-border bg-canvas px-2 py-1.5 text-xs font-mono text-muted"
          />
          <button
            onClick={handleCopyUrl}
            className="px-3 py-1.5 text-xs bg-accent text-paper rounded hover:bg-accentMuted transition-colors shrink-0"
          >
            {copiedUrl ? 'Copied!' : 'Copy URL'}
          </button>
        </div>
      </div>

      {/* Embed */}
      <div>
        <h3 className="text-sm font-medium mb-2">Embed</h3>
        <div className="flex gap-3 mb-3">
          <div>
            <label className="text-xs text-muted block mb-1">Width (px)</label>
            <input
              type="number"
              value={embedWidth}
              onChange={(e) => setEmbedWidth(Number(e.target.value))}
              className="w-20 rounded border border-border bg-canvas px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Height (px)</label>
            <input
              type="number"
              value={embedHeight}
              onChange={(e) => setEmbedHeight(Number(e.target.value))}
              className="w-20 rounded border border-border bg-canvas px-2 py-1 text-xs"
            />
          </div>
        </div>
        {/* Dimension preview */}
        <div className="mb-3 border-2 border-dashed border-border rounded flex items-center justify-center text-xs text-muted h-20">
          {embedWidth} × {embedHeight} px
        </div>
        <textarea
          value={embedCode}
          readOnly
          rows={3}
          className="w-full rounded border border-border bg-canvas px-2 py-1.5 text-xs font-mono text-muted resize-none mb-2"
        />
        <button
          onClick={handleCopyEmbed}
          className="w-full py-1.5 text-xs bg-accent text-paper rounded hover:bg-accentMuted transition-colors"
        >
          {copiedEmbed ? 'Copied!' : 'Copy Embed Code'}
        </button>
      </div>
    </div>
  )
}
