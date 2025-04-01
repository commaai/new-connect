import type { Route, RouteInfo, RouteSegments, RouteShareSignature } from '~/api/types'

import { fetcher } from '.'
import { API_URL } from './config'

export const parseRouteName = (routeName: string): RouteInfo => {
  const [dongleId, routeId] = routeName.split('|')
  return { dongleId, routeId }
}

export const getRoute = (routeName: Route['fullname']) => fetcher<Route>(`/v1/route/${routeName}/`).catch(() => undefined)

export const getRouteShareSignature = (routeName: string) => fetcher<RouteShareSignature>(`/v1/route/${routeName}/share_signature`)

export const createQCameraStreamUrl = (routeName: Route['fullname'], signature: RouteShareSignature): string =>
  `${API_URL}/v1/route/${routeName}/qcamera.m3u8?${new URLSearchParams(signature).toString()}`

export const getQCameraStreamUrl = (routeName: Route['fullname']) =>
  getRouteShareSignature(routeName)
    .then((signature) => createQCameraStreamUrl(routeName, signature))
    .catch(() => undefined)

export const setRoutePublic = (routeName: string, isPublic: boolean): Promise<Route> =>
  fetcher<Route>(`/v1/route/${routeName}/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_public: isPublic }),
  })

export const getPreservedRoutes = (dongleId: string): Promise<Route[]> =>
  fetcher<Route[]>(`/v1/devices/${dongleId}/routes/preserved`).catch(() => [])

export const setRoutePreserved = (routeName: string, preserved: boolean): Promise<Route> =>
  fetcher<Route>(`/v1/route/${routeName}/preserve`, { method: preserved ? 'POST' : 'DELETE' })

export const getRoutesSegments = (dongleId: string, limit: number | undefined, end: number | undefined) => {
  const params = new URLSearchParams()
  if (limit) params.append('limit', limit.toString())
  if (end) params.append('end', end.toString())
  return fetcher<RouteSegments[]>(`/v1/devices/${dongleId}/routes_segments?${params}`)
}
