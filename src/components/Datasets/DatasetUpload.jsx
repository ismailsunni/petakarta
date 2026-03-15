import { useCallback, useRef, useState } from 'react'
import useDatasetsStore from '../../store/datasetsStore'
import useAuthStore from '../../store/authStore'

export default function DatasetUpload({ onSuccess }) {
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [customName, setCustomName] = useState('')

  const user = useAuthStore((s) => s.user)
  const uploading = useDatasetsStore((s) => s.uploading)
  const uploadError = useDatasetsStore((s) => s.uploadError)
  const uploadDataset = useDatasetsStore((s) => s.uploadDataset)
  const addLayerFromDataset = useDatasetsStore((s) => s.addLayerFromDataset)

  const handleUpload = useCallback(async (file) => {
    if (!file || !user) return

    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.geojson') && !file.name.toLowerCase().endsWith('.json')) {
      useDatasetsStore.setState({ uploadError: 'Please upload a GeoJSON file (.geojson or .json)' })
      return
    }

    const { data, error } = await uploadDataset(file, user.id, customName || null)

    if (!error && data) {
      setCustomName('')
      // Automatically add to map
      await addLayerFromDataset(data)
      onSuccess?.()
    }
  }, [user, customName, uploadDataset, addLayerFromDataset, onSuccess])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleUpload(file)
  }, [handleUpload])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0]
    if (file) {
      handleUpload(file)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }, [handleUpload])

  if (!user) {
    return (
      <div className="rounded border border-border bg-canvas p-4 text-center">
        <p className="text-sm text-muted">Sign in to upload datasets</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-accent bg-accent/5'
            : 'border-border hover:border-accent'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm text-muted">Uploading...</span>
          </div>
        ) : (
          <>
            <svg className="mx-auto h-8 w-8 text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-muted">Drag & drop a GeoJSON file</p>
            <p className="text-xs text-muted mt-1">or click to browse</p>
            <p className="text-xs text-muted mt-2">Max 10MB • ~50k features</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".geojson,.json"
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading}
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Custom name (optional)</label>
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="e.g., Roads Network"
          className="w-full rounded border border-border bg-paper px-2 py-1.5 text-sm placeholder:text-muted/60"
          disabled={uploading}
        />
      </div>

      {uploadError && (
        <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-600">
          {uploadError}
        </div>
      )}
    </div>
  )
}
