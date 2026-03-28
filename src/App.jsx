import { useEffect, useState } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import Header from './components/Header'
import Footer from './components/Footer'
import MapView from './components/Map/MapView'
import Sidebar from './components/Sidebar/Sidebar'
import BottomSheet from './components/Mobile/BottomSheet'
import MobileFAB from './components/Mobile/MobileFAB'
import GalleryPage from './components/Gallery/GalleryPage'
import AboutPage from './components/About/AboutPage'
import useAuthStore from './store/authStore'
import useLayerTreeStore from './store/layerTreeStore'
import { loadProject, loadProjectBySlug, normalizeProjectState } from './lib/projectsService'
import { ExportProvider } from './contexts/ExportContext'
import useAppRoute from './hooks/useAppRoute'

function MapEditor() {
  const { projectId, projectSlug, embed } = useAppRoute()
  const viewMode = useLayerTreeStore((s) => s.viewMode)
  const hasSharedProject = !!(projectId || projectSlug)
  const [shareLoading, setShareLoading] = useState(hasSharedProject)
  const [shareError, setShareError] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    if (embed) {
      useLayerTreeStore.setState({ viewMode: 'view' })
    }

    if (projectId || projectSlug) {
      useLayerTreeStore.setState({ viewMode: 'view' })

      const doLoad = async () => {
        let data, error
        if (projectSlug) {
          ;({ data, error } = await loadProjectBySlug(projectSlug))
        } else {
          ;({ data, error } = await loadProject(projectId))
        }

        if (error || !data?.state_json) {
          setShareError(error?.message || 'Project not found or is private.')
          setShareLoading(false)
          return
        }
        const normalized = normalizeProjectState(data.state_json)
        useLayerTreeStore.getState().loadProject(normalized)
        useLayerTreeStore.setState({
          viewMode: 'view',
          activeProjectId: data.id,
          activeProjectName: data.name || '',
          activeProjectVisibility: data.visibility ?? (data.is_public ? 'public' : 'private'),
          activeProjectSlug: data.slug ?? null,
        })

        if (data.name) {
          document.title = `${data.name} — PetaKarta`
          document.querySelector('meta[property="og:title"]')?.setAttribute('content', data.name)
        }

        setShareLoading(false)

        // Dispatch event to zoom to map extent after loading
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('zoomToMapExtent'))
        }, 100)
      }

      doLoad()
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
    <ExportProvider>
      <div className="flex flex-col h-full font-sans bg-canvas text-ink overflow-hidden">
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
        {showEditor && (
          <>
            <MobileFAB onClick={() => setSheetOpen(true)} />
            <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
          </>
        )}
      </div>
    </ExportProvider>
  )
}

export default function App() {
  useEffect(() => {
    useAuthStore.getState().initialize()
  }, [])

  const { page } = useAppRoute()
  if (page === 'gallery') return <GalleryPage />
  if (page === 'about') return <AboutPage />
  return (
    <ErrorBoundary>
      <MapEditor />
    </ErrorBoundary>
  )
}
