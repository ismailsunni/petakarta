import { useCallback, useRef, useState } from 'react'
import useMapStore from '../../store/mapStore'
import { parseCSV } from '../../utils/csvParser'
import { parseCSVString } from '../../utils/csvParser'
import { matchProvinces } from '../../utils/provinceMatcher'

const SAMPLES = [
  { key: 'gdp', label: 'GDP per Capita', file: 'sample_gdp_per_capita.csv', keyCol: 'province_name', keyType: 'name', valueCol: 'gdp_per_capita_2023' },
  { key: 'hdi', label: 'Human Development Index', file: 'sample_hdi.csv', keyCol: 'pcode', keyType: 'id', valueCol: 'hdi_2023' },
  { key: 'pop', label: 'Population Density', file: 'sample_population_density.csv', keyCol: 'province_name', keyType: 'name', valueCol: 'pop_density' },
]

export default function DataTab() {
  const fileInputRef = useRef(null)
  const csvData = useMapStore((s) => s.csvData)
  const csvColumns = useMapStore((s) => s.csvColumns)
  const keyColumn = useMapStore((s) => s.keyColumn)
  const keyType = useMapStore((s) => s.keyType)
  const valueColumn = useMapStore((s) => s.valueColumn)
  const joinResult = useMapStore((s) => s.joinResult)
  const setCsvData = useMapStore((s) => s.setCsvData)
  const setKeyColumn = useMapStore((s) => s.setKeyColumn)
  const setKeyType = useMapStore((s) => s.setKeyType)
  const setValueColumn = useMapStore((s) => s.setValueColumn)
  const setJoinResult = useMapStore((s) => s.setJoinResult)
  const provinceFeatures = useMapStore((s) => s.provinceFeatures)
  const resetData = useMapStore((s) => s.resetData)

  const [selectedSample, setSelectedSample] = useState('')

  const handleLoadSample = useCallback(async () => {
    const sample = SAMPLES.find((s) => s.key === selectedSample)
    if (!sample) return
    const url = import.meta.env.BASE_URL + 'samples/' + sample.file
    const response = await fetch(url)
    const text = await response.text()
    const { data, columns } = parseCSVString(text)
    setCsvData(data, columns)
    setKeyColumn(sample.keyCol)
    setKeyType(sample.keyType)
    setValueColumn(sample.valueCol)
    setJoinResult(null)
  }, [selectedSample, setCsvData, setKeyColumn, setKeyType, setValueColumn, setJoinResult])

  const handleApply = useCallback(() => {
    if (!csvData || !keyColumn || !valueColumn || provinceFeatures.length === 0) return
    const result = matchProvinces(csvData, keyColumn, keyType, valueColumn, provinceFeatures)
    setJoinResult(result)
  }, [csvData, keyColumn, keyType, valueColumn, provinceFeatures, setJoinResult])

  const handleFile = useCallback(async (file) => {
    if (!file || !file.name.endsWith('.csv')) return
    const { data, columns } = await parseCSV(file)
    setCsvData(data, columns)
    setJoinResult(null)
  }, [setCsvData, setJoinResult])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Upload CSV</h3>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-accent transition-colors"
        >
          <p className="text-sm text-muted">Drag & drop a CSV file</p>
          <p className="text-xs text-muted mt-1">or click to browse</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted">or try sample data</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedSample}
            onChange={(e) => setSelectedSample(e.target.value)}
            className="flex-1 rounded border border-border bg-paper px-2 py-1 text-sm"
          >
            <option value="">Select sample...</option>
            {SAMPLES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={handleLoadSample}
            disabled={!selectedSample}
            className="bg-ink text-paper px-3 py-1 rounded text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Load
          </button>
        </div>
      </div>

      {csvData && (
        <>
          <div>
            <h3 className="text-sm font-medium mb-2">Column Mapping</h3>
            <div className="space-y-2">
              <label className="block">
                <span className="text-xs text-muted">Province Key Column</span>
                <select
                  value={keyColumn}
                  onChange={(e) => setKeyColumn(e.target.value)}
                  className="mt-1 block w-full rounded border border-border bg-paper px-2 py-1 text-sm"
                >
                  <option value="">Select column...</option>
                  {csvColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </label>

              <div>
                <span className="text-xs text-muted">Key Type</span>
                <div className="flex gap-3 mt-1">
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="radio"
                      name="keyType"
                      value="id"
                      checked={keyType === 'id'}
                      onChange={() => setKeyType('id')}
                    />
                    ID (e.g. ID-AC)
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="radio"
                      name="keyType"
                      value="name"
                      checked={keyType === 'name'}
                      onChange={() => setKeyType('name')}
                    />
                    Name
                  </label>
                </div>
              </div>

              <label className="block">
                <span className="text-xs text-muted">Value Column</span>
                <select
                  value={valueColumn}
                  onChange={(e) => setValueColumn(e.target.value)}
                  className="mt-1 block w-full rounded border border-border bg-paper px-2 py-1 text-sm"
                >
                  <option value="">Select column...</option>
                  {csvColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </label>

              <button
                onClick={handleApply}
                disabled={!keyColumn || !valueColumn}
                className="w-full mt-2 bg-accent text-paper py-1.5 rounded text-sm font-medium hover:bg-accentMuted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          </div>

          {joinResult && (
            <div className={`rounded p-3 text-sm ${joinResult.matched < 19 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <p>{joinResult.matched} provinces matched</p>
              {joinResult.unmatched > 0 && (
                <p className="text-muted text-xs mt-1">
                  {joinResult.unmatched} unmatched: {joinResult.unmatchedKeys.join(', ')}
                </p>
              )}
            </div>
          )}

          {csvData.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Data Preview</h3>
              <div className="overflow-x-auto text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {csvColumns.slice(0, 4).map((col) => (
                        <th key={col} className="border border-border px-2 py-1 text-left bg-canvas">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {csvColumns.slice(0, 4).map((col) => (
                          <td key={col} className="border border-border px-2 py-1 font-mono">{row[col]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            onClick={resetData}
            className="text-xs text-muted hover:text-accent transition-colors"
          >
            Clear data
          </button>
        </>
      )}
    </div>
  )
}
