import { useCallback, useEffect, useRef, useState } from 'react'
import { listPublicProjects } from '../../lib/projectsService'

const PAGE_SIZE = 12

export default function GalleryPage() {
  const [projects, setProjects] = useState([])
  const [totalCount, setTotalCount] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const offsetRef = useRef(0)
  const fetchingRef = useRef(false)
  const countRef = useRef(null)
  const sentinelRef = useRef(null)
  const searchTimerRef = useRef(null)

  // Debounce search input
  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchQuery(val)
    clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(val), 300)
  }

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

  // Client-side filter + sort
  let displayed = projects
  if (debouncedSearch) {
    const q = debouncedSearch.toLowerCase()
    displayed = displayed.filter((p) => {
      const title = (p.state_json?.mapTitle || p.name || '').toLowerCase()
      return title.includes(q)
    })
  }
  if (sortOrder === 'oldest') {
    displayed = [...displayed].sort(
      (a, b) => new Date(a.updated_at) - new Date(b.updated_at)
    )
  }

  const allLoaded = totalCount !== null && offsetRef.current >= totalCount

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

      {/* Controls */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-2 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <input
          type="search"
          placeholder="Search maps..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="flex-1 rounded border border-border bg-paper px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="rounded border border-border bg-paper px-3 py-1.5 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayed.map((project) => {
            const state = project.state_json || {}
            const mapTitle = state.mapTitle || project.name || 'Untitled'
            const mapDescription = state.mapDescription || ''
            const author = project.profiles?.full_name || project.profiles?.username || null
            const projectUrl = project.slug
              ? `${baseUrl}?p=${project.slug}`
              : `${baseUrl}?project=${project.id}`
            const thumbnailUrl = project.thumbnail_url || null
            const date = project.updated_at
              ? new Date(project.updated_at).toLocaleDateString()
              : null

            return (
              <div
                key={project.id}
                className="rounded-lg border border-border bg-paper shadow-sm overflow-hidden"
              >
                {/* 16:9 thumbnail */}
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={mapTitle}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-ink flex items-center justify-center">
                      <span className="text-paper/30 text-xs font-mono">No preview</span>
                    </div>
                  )}
                </div>
                <div className="px-4 py-3">
                  <a
                    href={projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:text-accent transition-colors block"
                  >
                    {mapTitle}
                  </a>
                  {mapDescription && (
                    <p className="text-xs text-muted mt-1 line-clamp-2">{mapDescription}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {author && <p className="text-xs text-muted">by {author}</p>}
                    {author && date && <span className="text-xs text-muted">·</span>}
                    {date && <p className="text-xs text-muted">{date}</p>}
                  </div>
                </div>
              </div>
            )
          })}
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

        {!loading && allLoaded && displayed.length > 0 && (
          <p className="text-center text-muted text-xs py-6">All maps loaded.</p>
        )}

        {!loading && debouncedSearch && displayed.length === 0 && projects.length > 0 && (
          <p className="text-center text-muted text-sm py-12">No maps match your search.</p>
        )}
      </div>
    </div>
  )
}
