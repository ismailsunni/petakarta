import { useCallback, useEffect, useRef, useState } from 'react'
import { listPublicProjects } from '../../lib/projectsService'

const PAGE_SIZE = 10

export default function GalleryPage() {
  const [projects, setProjects] = useState([])
  const [totalCount, setTotalCount] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const offsetRef = useRef(0)
  const fetchingRef = useRef(false)
  const countRef = useRef(null)
  const sentinelRef = useRef(null)

  const fetchPage = useCallback(async () => {
    if (fetchingRef.current) return
    if (countRef.current !== null && offsetRef.current >= countRef.current) return
    fetchingRef.current = true
    setLoading(true)
    const { data, error: err, count } = await listPublicProjects({
      limit: PAGE_SIZE,
      offset: offsetRef.current,
    })
    if (err) {
      setError(err.message || 'Failed to load projects.')
      setLoading(false)
      fetchingRef.current = false
      return
    }
    setProjects((prev) => [...prev, ...data])
    setTotalCount(count)
    countRef.current = count
    offsetRef.current += data.length
    setLoading(false)
    fetchingRef.current = false
  }, [])

  // Infinite scroll via IntersectionObserver (also handles initial fetch)
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchPage()
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchPage])

  const baseUrl = import.meta.env.BASE_URL

  return (
    <div className="min-h-full bg-canvas text-ink font-sans">
      {/* Header */}
      <header className="h-[52px] bg-ink text-paper flex items-center justify-between px-5 shrink-0 border-b border-ink/20">
        <h1 className="font-display text-xl tracking-tight">PetaKarta Gallery</h1>
        <div className="flex items-center gap-4 text-sm">
          <a href={`${import.meta.env.BASE_URL}?page=about`} className="text-paper/80 hover:text-paper transition-colors">About</a>
          <a href={import.meta.env.BASE_URL} className="text-paper/80 hover:text-paper transition-colors">Open Editor</a>
        </div>
      </header>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-lg border border-border bg-paper shadow-sm overflow-hidden"
            >
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={`${baseUrl}?project=${project.id}&embed=true`}
                  title={project.name || 'Untitled'}
                  className="absolute inset-0 w-full h-full"
                  loading="lazy"
                />
              </div>
              <div className="px-4 py-3">
                <a
                  href={`${baseUrl}?project=${project.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium truncate hover:text-accent transition-colors block"
                >
                  {project.name || 'Untitled'}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} className="h-1" />

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && totalCount === 0 && (
          <p className="text-center text-muted text-sm py-12">No public maps yet.</p>
        )}

        {!loading && totalCount !== null && offsetRef.current >= totalCount && projects.length > 0 && (
          <p className="text-center text-muted text-xs py-6">All maps loaded.</p>
        )}
      </div>
    </div>
  )
}
