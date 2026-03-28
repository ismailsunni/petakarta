import { useState } from 'react'
import useLayerTreeStore from '../../store/layerTreeStore'

function openPopup(url, title) {
  window.open(url, title, 'width=600,height=450,resizable=yes,scrollbars=yes')
}

function TwitterIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

export default function ShareTab() {
  const activeProjectId = useLayerTreeStore((s) => s.activeProjectId)
  const activeProjectSlug = useLayerTreeStore((s) => s.activeProjectSlug)
  const activeProjectVisibility = useLayerTreeStore((s) => s.activeProjectVisibility)
  const mapTitle = useLayerTreeStore((s) => s.mapTitle)
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
    ? `${origin}${base}?p=${activeProjectSlug}`
    : `${origin}${base}?project=${activeProjectId}`
  const embedSrc = shareUrl.includes('?') ? `${shareUrl}&embed=true` : `${shareUrl}?embed=true`
  const embedCode = `<iframe src="${embedSrc}" width="${embedWidth}" height="${embedHeight}" frameborder="0"></iframe>`

  const shareTitle = mapTitle || 'Check out this map on PetaKarta'
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(shareTitle)

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

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl })
      } catch {
        // User cancelled or share failed — no-op
      }
    }
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

      {/* Social media sharing */}
      <div>
        <h3 className="text-sm font-medium mb-3">Share on Social Media</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => openPopup(
              `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
              'Share on X'
            )}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-border hover:bg-canvas transition-colors"
            title="Share on X / Twitter"
          >
            <TwitterIcon /> X
          </button>
          <button
            onClick={() => openPopup(
              `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
              'Share on Facebook'
            )}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-border hover:bg-canvas transition-colors"
            title="Share on Facebook"
          >
            <FacebookIcon /> Facebook
          </button>
          <button
            onClick={() => openPopup(
              `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
              'Share on LinkedIn'
            )}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-border hover:bg-canvas transition-colors"
            title="Share on LinkedIn"
          >
            <LinkedInIcon /> LinkedIn
          </button>
          <button
            onClick={() => openPopup(
              `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
              'Share on WhatsApp'
            )}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-border hover:bg-canvas transition-colors"
            title="Share on WhatsApp"
          >
            <WhatsAppIcon /> WhatsApp
          </button>
        </div>

        {typeof navigator !== 'undefined' && navigator.share && (
          <button
            onClick={handleNativeShare}
            className="mt-3 w-full py-1.5 text-xs border border-accent text-accent rounded hover:bg-accent/5 transition-colors"
          >
            Share via device…
          </button>
        )}
      </div>
    </div>
  )
}
