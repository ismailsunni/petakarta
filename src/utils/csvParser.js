import Papa from 'papaparse'

export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        resolve({
          data: results.data,
          columns: results.meta.fields,
        })
      },
      error: (error) => reject(error),
    })
  })
}

export function generateTemplateCsv(adminFeatures, layerConfig) {
  const header = [layerConfig.featureIdField, layerConfig.featureNameField, 'value']
  const rows = adminFeatures.map((f) => [f.featureId, f.featureName, ''])
  return [header, ...rows].map((r) => r.join(',')).join('\n')
}

export function downloadTemplateCsv(adminFeatures, layerConfig, layerId) {
  const csv = generateTemplateCsv(adminFeatures, layerConfig)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${layerId}-template.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function parseCSVString(text) {
  const results = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  })
  return {
    data: results.data,
    columns: results.meta.fields,
  }
}
