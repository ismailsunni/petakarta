import { useCallback, useEffect, useState } from 'react'
import useMapStore from '../../store/mapStore'
import { matchFeatures } from '../../utils/featureMatcher'
import { getLayer } from '../../utils/adminLayers'

export default function ManualDataTable() {
  const adminFeatures = useMapStore((s) => s.adminFeatures)
  const adminLayerId = useMapStore((s) => s.adminLayerId)
  const manualValues = useMapStore((s) => s.manualValues)
  const manualValueLabel = useMapStore((s) => s.manualValueLabel)
  const joinResult = useMapStore((s) => s.joinResult)
  const update = useMapStore((s) => s.update)

  const layerConfig = getLayer(adminLayerId)

  // Local copy for responsive input rendering
  const [localValues, setLocalValues] = useState(manualValues)
  const [localLabel, setLocalLabel] = useState(manualValueLabel)

  // Sync if store resets externally
  useEffect(() => { setLocalValues(manualValues) }, [manualValues])
  useEffect(() => { setLocalLabel(manualValueLabel) }, [manualValueLabel])

  const recompute = useCallback((values, label) => {
    const featureIdField = layerConfig.featureIdField
    const valueCol = label || 'value'
    const csvData = adminFeatures
      .filter((f) => values[f.featureId] !== undefined && values[f.featureId] !== '')
      .map((f) => ({ [featureIdField]: f.featureId, [valueCol]: values[f.featureId] }))
    const csvColumns = [featureIdField, valueCol]
    const result = matchFeatures(csvData, featureIdField, 'id', valueCol, adminFeatures, layerConfig)
    update({
      manualValues: values,
      manualValueLabel: label,
      csvData,
      csvColumns,
      keyColumn: featureIdField,
      keyType: 'id',
      valueColumn: valueCol,
      joinResult: result,
      featureValues: result.valueMap,
    })
  }, [adminFeatures, layerConfig, update])

  const handleValueChange = useCallback((featureId, val) => {
    const newValues = { ...localValues, [featureId]: val }
    setLocalValues(newValues)
    recompute(newValues, localLabel)
  }, [localValues, localLabel, recompute])

  const handleLabelChange = useCallback((label) => {
    setLocalLabel(label)
    recompute(localValues, label)
  }, [localValues, recompute])

  const handleClearAll = useCallback(() => {
    setLocalValues({})
    update({ manualValues: {}, csvData: null, joinResult: null, featureValues: {} })
  }, [update])

  const handleExportCsv = useCallback(() => {
    const featureIdField = layerConfig.featureIdField
    const valueCol = manualValueLabel || 'value'
    const header = [featureIdField, layerConfig.featureNameField, valueCol]
    const rows = adminFeatures.map((f) => [f.featureId, f.featureName, localValues[f.featureId] ?? ''])
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${adminLayerId}-manual-data.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [adminFeatures, layerConfig, adminLayerId, manualValueLabel, localValues])

  if (adminFeatures.length === 0) {
    return <p className="text-sm text-muted">Loading features...</p>
  }

  const sorted = [...adminFeatures].sort((a, b) => a.featureName.localeCompare(b.featureName))
  const filledCount = Object.values(localValues).filter((v) => v !== '').length

  return (
    <div className="space-y-3">
      <div>
        <label className="block">
          <span className="text-xs text-muted">Value label</span>
          <input
            type="text"
            value={localLabel}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="value"
            className="mt-1 block w-full rounded border border-border bg-paper px-2 py-1 text-sm"
          />
        </label>
      </div>

      <div className="overflow-y-auto max-h-80 rounded border border-border">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-canvas z-10">
            <tr>
              <th className="border-b border-border px-2 py-1.5 text-left font-medium">Area</th>
              <th className="border-b border-border px-2 py-1.5 text-left font-medium">{localLabel || 'Value'}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((f) => (
              <tr key={f.featureId} className="hover:bg-canvas">
                <td className="border-b border-border px-2 py-1">{f.featureName}</td>
                <td className="border-b border-border px-1 py-0.5">
                  <input
                    type="text"
                    value={localValues[f.featureId] ?? ''}
                    onChange={(e) => handleValueChange(f.featureId, e.target.value)}
                    className="w-full bg-transparent px-1 py-0.5 font-mono focus:outline-none focus:bg-paper rounded"
                    placeholder="—"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {joinResult && (
        <div className={`rounded p-2 text-xs ${joinResult.matched < Math.ceil(adminFeatures.length / 2) ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          {joinResult.matched} of {adminFeatures.length} areas filled
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{filledCount} / {adminFeatures.length} filled</span>
        <div className="flex gap-3">
          <button
            onClick={handleClearAll}
            disabled={filledCount === 0}
            className="text-xs text-muted hover:text-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear all
          </button>
          <button
            onClick={handleExportCsv}
            disabled={filledCount === 0}
            className="text-xs text-accent hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
          >
            Export as CSV
          </button>
        </div>
      </div>
    </div>
  )
}
