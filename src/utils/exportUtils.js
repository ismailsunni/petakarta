export const DPI_PRESETS = [
  { value: 72, label: 'Screen (72 DPI)', hint: '~600×375px' },
  { value: 144, label: 'Web (144 DPI)', hint: '~1200×750px' },
  { value: 300, label: 'Print (300 DPI)', hint: '~2500×1563px' },
]

export function dpiToPixelRatio(dpi) {
  return dpi / 96
}
