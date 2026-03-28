import { useMemo } from 'react'

export default function useAppRoute() {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search)

    // Slug from query param: ?p=indonesia-gdp
    const projectSlug = params.get('p')

    return {
      projectId: params.get('project'),
      projectSlug,
      embed: params.get('embed') === 'true',
      page: params.get('page'),
    }
  }, [])
}
