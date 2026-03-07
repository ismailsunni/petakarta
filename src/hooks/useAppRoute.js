import { useMemo } from 'react'

export default function useAppRoute() {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return {
      projectId: params.get('project'),
      embed: params.get('embed') === 'true',
      page: params.get('page'),
    }
  }, [])
}
