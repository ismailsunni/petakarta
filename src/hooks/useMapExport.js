import { useCallback } from 'react'
import html2canvas from 'html2canvas'
import { transformExtent } from 'ol/proj'
import useMapStore from '../store/mapStore'

const INDONESIA_FIT_EXTENT = transformExtent([94.5, -11.5, 141.5, 6.5], 'EPSG:4326', 'EPSG:3857')

export default function useMapExport(map) {
  const exportMap = useCallback(async (resolution = 2) => {
    if (!map) return

    // Fit to Indonesia before export
    map.getView().fit(INDONESIA_FIT_EXTENT, { padding: [20, 20, 20, 20], duration: 0 })

    // Wait for map render after fit
    await new Promise((resolve) => {
      map.once('rendercomplete', resolve)
      map.renderSync()
    })

    const size = map.getSize()
    const titleHeight = useMapStore.getState().mapTitle ? 40 * resolution : 0
    const mapCanvas = document.createElement('canvas')
    mapCanvas.width = size[0] * resolution
    mapCanvas.height = size[1] * resolution + titleHeight
    const ctx = mapCanvas.getContext('2d')

    // Fill background
    ctx.fillStyle = '#edeae3'
    ctx.fillRect(0, 0, mapCanvas.width, mapCanvas.height)

    // Draw title if set
    const mapTitle = useMapStore.getState().mapTitle
    if (mapTitle) {
      ctx.fillStyle = '#1a1a2e'
      ctx.font = `bold ${18 * resolution}px "IBM Plex Sans", sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(mapTitle, mapCanvas.width / 2, 28 * resolution)
    }

    // Composite all OL canvas layers
    const canvases = map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer')
    canvases.forEach((canvas) => {
      if (canvas.width > 0) {
        const opacity = canvas.parentNode.style.opacity || canvas.style.opacity
        ctx.globalAlpha = opacity === '' ? 1 : Number(opacity)

        const transform = canvas.style.transform
        const matrix = transform
          .match(/^matrix\(([^)]*)\)$/)?.[1]
          ?.split(',')
          .map(Number)

        if (matrix) {
          ctx.setTransform(
            matrix[0] * resolution,
            matrix[1] * resolution,
            matrix[2] * resolution,
            matrix[3] * resolution,
            matrix[4] * resolution,
            matrix[5] * resolution + titleHeight
          )
        } else {
          ctx.setTransform(resolution, 0, 0, resolution, 0, titleHeight)
        }

        ctx.drawImage(canvas, 0, 0)
      }
    })

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalAlpha = 1

    // Composite legend using html2canvas
    const legendEl = document.getElementById('map-legend')
    if (legendEl) {
      try {
        const legendCanvas = await html2canvas(legendEl, {
          backgroundColor: null,
          scale: resolution,
        })

        // Position legend on the export canvas matching its visual position
        const legendRect = legendEl.getBoundingClientRect()
        const mapRect = map.getTargetElement().getBoundingClientRect()
        const offsetX = (legendRect.left - mapRect.left) * resolution
        const offsetY = (legendRect.top - mapRect.top) * resolution + titleHeight

        ctx.drawImage(legendCanvas, offsetX, offsetY)
      } catch {
        // Legend compositing failed silently — export map without legend
      }
    }

    mapCanvas.toBlob((blob) => {
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
