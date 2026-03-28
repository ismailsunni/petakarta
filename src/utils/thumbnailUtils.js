const THUMBNAIL_WIDTH = 400

/**
 * Capture the OL map canvas as a small PNG data URL.
 * Returns a base64 data URL string, or null if capture fails.
 *
 * @param {import('ol/Map').default} map - OpenLayers map instance
 * @returns {Promise<string|null>}
 */
export async function captureMapThumbnail(map) {
  if (!map) return null

  try {
    // Wait for map to finish rendering
    await new Promise((resolve) => {
      map.once('rendercomplete', resolve)
      map.renderSync()
    })

    const mapSize = map.getSize()
    if (!mapSize) return null
    const [mapW, mapH] = mapSize

    // Composite all OL layer canvases into a single canvas
    const tmpCanvas = document.createElement('canvas')
    tmpCanvas.width = mapW
    tmpCanvas.height = mapH
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

    // Scale down to thumbnail width while maintaining aspect ratio
    const scale = THUMBNAIL_WIDTH / mapW
    const thumbH = Math.round(mapH * scale)

    const thumbCanvas = document.createElement('canvas')
    thumbCanvas.width = THUMBNAIL_WIDTH
    thumbCanvas.height = thumbH
    const thumbCtx = thumbCanvas.getContext('2d')
    thumbCtx.drawImage(tmpCanvas, 0, 0, THUMBNAIL_WIDTH, thumbH)

    return thumbCanvas.toDataURL('image/png')
  } catch {
    return null
  }
}

/**
 * Calculate thumbnail height for a given map width/height.
 * Exported for testing.
 */
export function calcThumbnailHeight(mapW, mapH) {
  if (!mapW || !mapH) return 0
  return Math.round((mapH / mapW) * THUMBNAIL_WIDTH)
}
