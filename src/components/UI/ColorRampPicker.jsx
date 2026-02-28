import useMapStore from '../../store/mapStore'
import { PRESET_GROUPS, getSwatchColors } from '../../utils/colorUtils'

export default function ColorRampPicker() {
  const colorPreset = useMapStore((s) => s.colorPreset)
  const colorReversed = useMapStore((s) => s.colorReversed)
  const setColorPreset = useMapStore((s) => s.setColorPreset)
  const setColorReversed = useMapStore((s) => s.setColorReversed)

  return (
    <div className="space-y-2">
      {Object.entries(PRESET_GROUPS).map(([group, presets]) => (
        <div key={group}>
          <span className="text-xs text-muted">{group}</span>
          <div className="grid grid-cols-2 gap-1.5 mt-1">
            {presets.map((key) => {
              const colors = getSwatchColors(key, 7)
              const isActive = colorPreset === key
              return (
                <button
                  key={key}
                  onClick={() => setColorPreset(key)}
                  className={`flex flex-col items-start gap-0.5 p-1.5 rounded border transition-colors ${
                    isActive ? 'border-accent bg-red-50' : 'border-border hover:border-muted'
                  }`}
                >
                  <div className="flex w-full h-3 rounded-sm overflow-hidden">
                    {colors.map((c, i) => (
                      <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted leading-none">{key}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <label className="flex items-center gap-2 text-sm mt-2">
        <input
          type="checkbox"
          checked={colorReversed}
          onChange={(e) => setColorReversed(e.target.checked)}
        />
        Reverse colors
      </label>
    </div>
  )
}
