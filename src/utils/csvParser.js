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
