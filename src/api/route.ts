import { fetcher } from '.'
import { BASE_URL } from './config'
import type { Device, Route, RouteShareSignature } from '~/types'
import { TimelineStatistics } from './derived'
import { getPlaceFromCoords } from '~/map'
import { getTimelineStatistics } from './derived'
import { formatRouteDistance, getRouteDuration } from '~/utils/date'

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

const formatEngagement = (timeline?: TimelineStatistics): number => {
  if (!timeline) return 0
  const { engagedDuration, duration } = timeline
  return parseInt((100 * (engagedDuration / duration)).toFixed(0))
}
  
const formatUserFlags = (timeline?: TimelineStatistics): number => {
  return timeline?.userFlags ?? 0
}

export const getDerivedData = async(route: Route): Promise<Route> => {
  const [startPlace, endPlace, timeline] = await Promise.all([
    getPlaceFromCoords(route.start_lng, route.start_lat),
    getPlaceFromCoords(route.end_lng, route.end_lat),
    getTimelineStatistics(route),
  ])

  route.ui_derived = {
    distance: formatRouteDistance(route),
    duration: getRouteDuration(route),
    flags: formatUserFlags(timeline),
    engagement: formatEngagement(timeline),
    address: {
      start: startPlace,
      end: endPlace,
    },
  }

  return route
}

export const getRoute = (routeName: Route['fullname']): Promise<Route> => {
  return new Promise((resolve, reject) => {
    fetcher<Route>(`/v1/route/${routeName}/`)
      .then(route => {
        getDerivedData(route)
          .then(res => resolve(res))
          .catch(() => resolve(route))
      }).catch(err => reject(err))
  })
}

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
