import type { Route, RouteInfo, RouteShareSignature } from '~/api/types'
import { useRouteCache } from '~/utils/cache'

import { fetcher } from '.'
import { API_URL } from './config'

export const parseRouteName = (routeName: string): RouteInfo => {
  const [dongleId, routeId] = routeName.split('|')
  return { dongleId, routeId }
}

export const getRoute = (routeName: Route['fullname']) => fetcher<Route>(`/v1/route/${routeName}/`)

const getRouteShareSignature = useRouteCache(
  (route: Route) => fetcher<RouteShareSignature>(`/v1/route/${route.fullname}/share_signature`),
  [],
)

export const getQCameraStreamUrl = (route: Route) =>
  getRouteShareSignature(route)
    .then((signature) => {
      return `${API_URL}/v1/route/${route.fullname}/qcamera.m3u8?${new URLSearchParams(signature).toString()}&maxqcamera=${route.maxqcamera}`
    })
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
