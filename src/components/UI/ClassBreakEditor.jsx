import { useState, useEffect } from 'react'
import useMapStore from '../../store/mapStore'

export default function ClassBreakEditor() {
  const numClasses = useMapStore((s) => s.numClasses)
  const manualBreaks = useMapStore((s) => s.manualBreaks)
  const joinResult = useMapStore((s) => s.joinResult)
  const update = useMapStore((s) => s.update)

  const [inputs, setInputs] = useState([])

  // Initialize inputs from current breaks or value range
  useEffect(() => {
    if (manualBreaks.length === numClasses + 1) {
      setInputs(manualBreaks.map(String))
    } else if (joinResult?.valueMap) {
      const values = Object.values(joinResult.valueMap)
      const min = Math.min(...values)
      const max = Math.max(...values)
      const step = (max - min) / numClasses
      const breaks = []
      for (let i = 0; i <= numClasses; i++) {
        breaks.push((min + step * i).toFixed(2))
      }
      setInputs(breaks)
    }
  }, [numClasses, joinResult])

  const handleChange = (index, value) => {
    const next = [...inputs]
    next[index] = value
    setInputs(next)
  }

  const handleApply = () => {
    const parsed = inputs.map(Number)
    if (parsed.some(isNaN)) return
    // Validate ascending order
    for (let i = 1; i < parsed.length; i++) {
      if (parsed[i] <= parsed[i - 1]) return
    }
    update({ manualBreaks: parsed })
  }

  return (
    <div className="space-y-2">
      <span className="text-xs text-muted">Break values (ascending)</span>
      <div className="space-y-1">
        {inputs.map((val, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-muted w-8">{i === 0 ? 'Min' : i === inputs.length - 1 ? 'Max' : `B${i}`}</span>
            <input
              type="number"
              value={val}
              onChange={(e) => handleChange(i, e.target.value)}
              step="any"
              className="flex-1 rounded border border-border bg-paper px-2 py-1 text-sm font-mono"
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleApply}
        className="w-full bg-ink text-paper py-1 rounded text-sm font-medium hover:bg-muted transition-colors"
      >
        Apply Breaks
      </button>
    </div>
  )
}
