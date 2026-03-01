import { useCallback } from 'react'
import html2canvas from 'html2canvas'
import useMapStore from '../store/mapStore'
import { INDONESIA_EXTENT_3857, FIT_PADDING } from '../utils/mapConstants'

export default function useMapExport(map) {
  const exportMap = useCallback(async (resolution = 2) => {
    if (!map) return

    // Fit to Indonesia before export
    map.getView().fit(INDONESIA_EXTENT_3857, { padding: FIT_PADDING, duration: 0 })

    // Wait for map render after fit
    await new Promise((resolve) => {
      map.once('rendercomplete', resolve)
      map.renderSync()
    })

    // Get the export bounds rectangle (pixel coordinates of Indonesia extent)
    const tl = map.getPixelFromCoordinate([INDONESIA_EXTENT_3857[0], INDONESIA_EXTENT_3857[3]])
    const br = map.getPixelFromCoordinate([INDONESIA_EXTENT_3857[2], INDONESIA_EXTENT_3857[1]])
    const cropX = Math.round(tl[0])
    const cropY = Math.round(tl[1])
    const cropW = Math.round(br[0] - tl[0])
    const cropH = Math.round(br[1] - tl[1])

    const mapTitle = useMapStore.getState().mapTitle
    const titleHeight = mapTitle ? 40 * resolution : 0

    // Output canvas sized to the cropped region
    const outCanvas = document.createElement('canvas')
    outCanvas.width = cropW * resolution
    outCanvas.height = cropH * resolution + titleHeight
    const ctx = outCanvas.getContext('2d')

    // Fill background
    ctx.fillStyle = '#edeae3'
    ctx.fillRect(0, 0, outCanvas.width, outCanvas.height)

    // Draw title if set
    if (mapTitle) {
      ctx.fillStyle = '#1a1a2e'
      ctx.font = `bold ${18 * resolution}px "IBM Plex Sans", sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(mapTitle, outCanvas.width / 2, 28 * resolution)
    }

    // First, composite full map into a temp canvas
    const mapSize = map.getSize()
    const tmpCanvas = document.createElement('canvas')
    tmpCanvas.width = mapSize[0]
    tmpCanvas.height = mapSize[1]
    const tmpCtx = tmpCanvas.getContext('2d')

    const canvases = map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer')
    canvases.forEach((canvas) => {
      if (canvas.width > 0) {
        const opacity = canvas.parentNode.style.opacity || canvas.style.opacity
        tmpCtx.globalAlpha = opacity === '' ? 1 : Number(opacity)

        const transform = canvas.style.transform
        const matrix = transform
          .match(/^matrix\(([^)]*)\)$/)?.[1]
          ?.split(',')
          .map(Number)

        if (matrix) {
          tmpCtx.setTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5])
        } else {
          tmpCtx.setTransform(1, 0, 0, 1, 0, 0)
        }

        tmpCtx.drawImage(canvas, 0, 0)
      }
    })

    // Draw cropped region from temp canvas onto output
    ctx.drawImage(
      tmpCanvas,
      cropX, cropY, cropW, cropH,
      0, titleHeight, outCanvas.width, outCanvas.height - titleHeight
    )

    // Composite legend using html2canvas
    const legendEl = document.getElementById('map-legend')
    if (legendEl) {
      try {
        const legendCanvas = await html2canvas(legendEl, {
          backgroundColor: null,
          scale: resolution,
        })

        // Compute legend offset relative to the cropped export region
        const mapContainer = map.getTargetElement()
        const mapRect = mapContainer.getBoundingClientRect()
        const legendRect = legendEl.getBoundingClientRect()
        const legendPixelX = legendRect.left - mapRect.left
        const legendPixelY = legendRect.top - mapRect.top
        const offsetX = (legendPixelX - cropX) * resolution
        const offsetY = (legendPixelY - cropY) * resolution + titleHeight
        ctx.drawImage(legendCanvas, offsetX, offsetY)
      } catch {
        // Legend compositing failed silently
      }
    }

    outCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `indonesia-map-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
    })
  }, [map])

  return { exportMap }
}
