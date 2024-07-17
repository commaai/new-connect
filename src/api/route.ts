import type { Route, RouteShareSignature } from '~/types'

import { fetcher } from '.'
import { BASE_URL } from './config'

export const getRoute = (routeName: Route['fullname']): Promise<Route> =>
  fetcher<Route>(`/v1/route/${routeName}/`)

export const getRouteShareSignature = (routeName: string): Promise<RouteShareSignature> =>
  fetcher(`/v1/route/${routeName}/share_signature`)

export const createQCameraStreamUrl = (
  routeName: Route['fullname'],
  signature: RouteShareSignature,
): string =>
  `${BASE_URL}/v1/route/${routeName}/qcamera.m3u8?${new URLSearchParams(signature).toString()}`

export const getQCameraStreamUrl = (routeName: Route['fullname']): Promise<string> =>
  getRouteShareSignature(routeName).then((signature) =>
    createQCameraStreamUrl(routeName, signature),
  )
