import { createContext, useContext, useRef } from 'react'

const ExportContext = createContext(null)

export function ExportProvider({ children }) {
  const exportFnRef = useRef(null)
  return (
    <ExportContext.Provider value={exportFnRef}>
      {children}
    </ExportContext.Provider>
  )
}

export function useExportContext() {
  return useContext(ExportContext)
}
