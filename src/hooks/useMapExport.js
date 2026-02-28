import { useCallback } from 'react'

export default function useMapExport(map) {
  const exportMap = useCallback((resolution = 2) => {
    if (!map) return

    map.once('rendercomplete', () => {
      const mapCanvas = document.createElement('canvas')
      const size = map.getSize()
      mapCanvas.width = size[0] * resolution
      mapCanvas.height = size[1] * resolution
      const ctx = mapCanvas.getContext('2d')

      // Fill background
      ctx.fillStyle = '#edeae3'
      ctx.fillRect(0, 0, mapCanvas.width, mapCanvas.height)

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
              matrix[5] * resolution
            )
          } else {
            ctx.setTransform(resolution, 0, 0, resolution, 0, 0)
          }

          ctx.drawImage(canvas, 0, 0)
        }
      })

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.globalAlpha = 1

      mapCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `indonesia-map-${Date.now()}.png`
        a.click()
        URL.revokeObjectURL(url)
      })
    })

    map.renderSync()
  }, [map])

  return { exportMap }
}
