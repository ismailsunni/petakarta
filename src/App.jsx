import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import MapView from './components/Map/MapView'
import Sidebar from './components/Sidebar/Sidebar'
import useAuthStore from './store/authStore'
import useMapStore from './store/mapStore'
import { loadProject, normalizeProjectState } from './lib/projectsService'

export default function App() {
  const viewMode = useMapStore((s) => s.viewMode)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareError, setShareError] = useState('')

  useEffect(() => {
    useAuthStore.getState().initialize()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const projectId = params.get('project')
    const embed = params.get('embed')

    if (embed === 'true') {
      useMapStore.getState().setViewMode('view')
    }

    if (projectId) {
      useMapStore.getState().setViewMode('view')
      setShareLoading(true)
      loadProject(projectId).then(({ data, error }) => {
        if (error || !data?.state_json) {
          setShareError(error?.message || 'Project not found or is private.')
          setShareLoading(false)
          return
        }
        useMapStore.setState(normalizeProjectState(data.state_json))
        useMapStore.getState().setActiveProjectId(data.id)
        useMapStore.getState().setActiveProjectName(data.name || '')
        useMapStore.getState().setActiveProjectPublic(data.is_public ?? false)
        setShareLoading(false)
      })
    }
  }, [])

  if (shareLoading) {
    return (
      <div className="flex items-center justify-center h-full font-sans bg-canvas text-ink">
        <p className="text-sm text-muted">Loading shared project...</p>
      </div>
    )
  }

  if (shareError) {
    return (
      <div className="flex items-center justify-center h-full font-sans bg-canvas text-ink">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-2">{shareError}</p>
          <a
            href={import.meta.env.BASE_URL}
            className="text-sm text-accent hover:underline"
          >
            Go to PetaKarta
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full font-sans bg-canvas text-ink">
      {viewMode === 'edit' && <Header />}
      <main className="flex flex-1 min-h-0">
        {viewMode === 'edit' && <Sidebar />}
        <MapView />
      </main>
      {viewMode === 'edit' && <Footer />}
    </div>
  )
}
