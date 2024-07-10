import { fetcher } from '.'
import { BASE_URL } from './config'
import type { Device, Route, RouteShareSignature, RouteSegments } from '~/types'

export class RouteName {
  // dongle ID        date str
  // 0123456789abcdef|2023-02-15--15-25-00

  static readonly regex = /^([0-9a-f]{16})\|(\d{4}-\d{2}-\d{2}--\d{2}-\d{2}-\d{2})$/
  static readonly regexGroup = {
    dongleId: 1,
    dateStr: 2,
  }

  static parse(routeName: Route['fullname']): RouteName | null {
    const match = routeName.match(RouteName.regex)
    if (!match) {
      return null
    }
    return new RouteName(match[RouteName.regexGroup.dongleId], match[RouteName.regexGroup.dateStr])
  }

  readonly dongleId: Device['dongle_id']
  readonly dateStr: string

  constructor(dongleId: Device['dongle_id'], dateStr: string) {
    this.dongleId = dongleId
    this.dateStr = dateStr
  }

  toString(): string {
    return `${this.dongleId}|${this.dateStr}`
  }
}

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

export const fetchRoutes = async ({
  dongleId,
  page,
  pageSize,
}: {
  dongleId: string
  page: number
  pageSize: number
}): Promise<RouteSegments[]> => {
  const endpoint = `/v1/devices/${dongleId}/routes_segments`
  const params = new URLSearchParams({
    limit: pageSize.toString(),
    offset: ((page - 1) * pageSize).toString(),
  })

  return fetcher<RouteSegments[]>(`${endpoint}?${params.toString()}`)
}
