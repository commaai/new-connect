import type { Route, RouteInfo, RouteShareSignature } from '~/api/types'
import { useRouteCache } from '~/utils/cache'

import { fetcher } from '.'
import { API_URL } from './config'

export const parseRouteName = (routeName: string): RouteInfo => {
  const [dongleId, routeId] = routeName.split('|')
  return { dongleId, routeId }
}

export const getRoute = (routeName: Route['fullname']) => fetcher<Route>(`/v1/route/${routeName}/`)

const getRouteShareSignature = (routeName: string) => fetcher<RouteShareSignature>(`/v1/route/${routeName}/share_signature`)

const createQCameraStreamUrl = (routeName: Route['fullname'], signature: RouteShareSignature): string =>
  `${API_URL}/v1/route/${routeName}/qcamera.m3u8?${new URLSearchParams(signature).toString()}`

const getQCameraStreamUrl = useRouteCache(
  (route: Route) =>
    getRouteShareSignature(route.fullname)
      .then((signature) => createQCameraStreamUrl(route.fullname, signature))
      .catch(() => undefined),
  { ignoreMaxqlog: true },
)

export const getQCameraStreamBlobUrl = useRouteCache(async (route: Route) => {
  const streamUrl = await getQCameraStreamUrl(route)
  if (!streamUrl) return undefined
  const blob = await (await fetch(streamUrl)).blob()
  return URL.createObjectURL(blob)
})

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
