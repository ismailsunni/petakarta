import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import MapView from './components/Map/MapView'
import Sidebar from './components/Sidebar/Sidebar'
import GalleryPage from './components/Gallery/GalleryPage'
import useAuthStore from './store/authStore'
import useMapStore from './store/mapStore'
import { loadProject, normalizeProjectState } from './lib/projectsService'

function getInitialParams() {
  const params = new URLSearchParams(window.location.search)
  return { projectId: params.get('project'), embed: params.get('embed'), page: params.get('page') }
}

function MapEditor() {
  const viewMode = useMapStore((s) => s.viewMode)
  const [shareLoading, setShareLoading] = useState(
    () => !!getInitialParams().projectId
  )
  const [shareError, setShareError] = useState('')

  useEffect(() => {
    const { projectId, embed } = getInitialParams()

    if (embed === 'true') {
      useMapStore.getState().setViewMode('view')
    }

    if (projectId) {
      useMapStore.getState().setViewMode('view')
      loadProject(projectId).then(({ data, error }) => {
        if (error || !data?.state_json) {
          setShareError(error?.message || 'Project not found or is private.')
          setShareLoading(false)
          return
        }
        useMapStore.setState(normalizeProjectState(data.state_json))
        useMapStore.getState().setViewMode('view')
        useMapStore.getState().setActiveProjectId(data.id)
        useMapStore.getState().setActiveProjectName(data.name || '')
        useMapStore.getState().setActiveProjectPublic(data.is_public ?? false)
        setShareLoading(false)
      })
    }
  }, [])

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

  const showEditor = viewMode === 'edit' && !shareLoading

  return (
    <div className="flex flex-col h-full font-sans bg-canvas text-ink">
      {showEditor && <Header />}
      <main className="relative flex flex-1 min-h-0">
        {showEditor && <Sidebar />}
        <MapView />
        {shareLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-canvas">
            <p className="text-sm text-muted">Loading shared project...</p>
          </div>
        )}
      </main>
      {showEditor && <Footer />}
    </div>
  )
}

export default function App() {
  useEffect(() => {
    useAuthStore.getState().initialize()
  }, [])

  const { page } = getInitialParams()
  if (page === 'gallery') return <GalleryPage />
  return <MapEditor />
}
