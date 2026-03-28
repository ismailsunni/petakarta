import { useMemo } from 'react'

export default function useAppRoute() {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search)

    // Parse slug from pathname: /petakarta/p/<slug>
    const base = import.meta.env.BASE_URL // e.g. '/petakarta/'
    const pathname = window.location.pathname
    const pathAfterBase = pathname.startsWith(base)
      ? pathname.slice(base.length)
      : pathname.replace(/^\//, '')
    const slugMatch = pathAfterBase.match(/^p\/([^/]+)$/)
    const projectSlug = slugMatch ? slugMatch[1] : null

    return {
      projectId: params.get('project'),
      projectSlug,
      embed: params.get('embed') === 'true',
      page: params.get('page'),
    }
  }, [])
}
