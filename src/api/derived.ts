import type { Route } from '~/api/types'
import { getRouteDuration } from '~/utils/format'

export interface GPSPathPoint {
  t: number
  lng: number
  lat: number
  speed: number
  dist: number
}

interface IDriveEvent {
  type: string
  time: number
  offset_millis: number
  route_offset_millis: number
  data: object
}

type EventDriveEvent = IDriveEvent & {
  type: 'event'
  data: {
    event_type: 'record_front_toggle' | 'first_road_camera_frame'
  }
}

type OpenpilotState = 'disabled' | 'preEnabled' | 'enabled' | 'softDisabling' | 'overriding'

type AlertStatus = 0 | 1 | 2

type StateDriveEvent = IDriveEvent & {
  type: 'state'
  data: {
    state: OpenpilotState
    enabled: boolean
    alertStatus: AlertStatus
  }
}

type UserFlagDriveEvent = IDriveEvent & {
  type: 'user_flag'
  data: Record<string, never>
}

type DriveEvent = EventDriveEvent | StateDriveEvent | UserFlagDriveEvent

type EngagedTimelineEvent = {
  type: 'engaged'
  route_offset_millis: number
  end_route_offset_millis: number
}

type AlertTimelineEvent = {
  type: 'alert'
  route_offset_millis: number
  end_route_offset_millis: number
  alertStatus: AlertStatus
}

type OverridingTimelineEvent = {
  type: 'overriding'
  route_offset_millis: number
  end_route_offset_millis: number
}

type UserFlagTimelineEvent = {
  type: 'user_flag'
  route_offset_millis: number
}

export type TimelineEvent = EngagedTimelineEvent | AlertTimelineEvent | OverridingTimelineEvent | UserFlagTimelineEvent

export interface RouteStatistics {
  routeDurationMs: number
  engagedDurationMs: number
  engagedDistanceRatio?: number
  userFlags: number
}

const getDerived = async <T>(route: Route, fn: string): Promise<T[]> => {
  if (!route) return []
  const urls = Array.from({ length: route.maxqlog + 1 }, (_, i) => `${route.url}/${i}/${fn}`)
  const results = urls.map((url) =>
    fetch(url)
      .then((res) => (res.ok ? (res.json() as T) : undefined))
      .catch((err) => {
        console.error('Error parsing file', url, err)
        return undefined
      }),
  )
  return (await Promise.all(results)).filter((it) => it !== undefined)
}

export const getCoords = (route: Route): Promise<GPSPathPoint[]> =>
  getDerived<GPSPathPoint[]>(route, 'coords.json').then((coords) => coords.flat())

const getDriveEvents = (route: Route): Promise<DriveEvent[]> =>
  getDerived<DriveEvent[]>(route, 'events.json').then((events) => events.flat())

const generateTimelineEvents = (route: Route, events: DriveEvent[]): TimelineEvent[] => {
  const routeDuration = getRouteDuration(route)?.asMilliseconds() ?? 0

  // sort events by timestamp
  events.sort((a, b) => {
    return a.route_offset_millis - b.route_offset_millis
  })

  // convert events to timeline events
  const res: TimelineEvent[] = []
  let lastEngaged: StateDriveEvent | undefined
  let lastAlert: StateDriveEvent | undefined
  let lastOverride: StateDriveEvent | undefined

  const isOverriding = (state: OpenpilotState) => ['overriding', 'preEnabled'].includes(state)

  events.forEach((ev) => {
    if (ev.type === 'state') {
      const { enabled, alertStatus, state } = ev.data
      if (lastEngaged && !enabled) {
        res.push({
          type: 'engaged',
          route_offset_millis: lastEngaged.route_offset_millis,
          end_route_offset_millis: ev.route_offset_millis,
        } as EngagedTimelineEvent)
        lastEngaged = undefined
      }
      if (!lastEngaged && enabled) {
        lastEngaged = ev
      }

      if (lastAlert && lastAlert.data.alertStatus !== alertStatus) {
        res.push({
          type: 'alert',
          route_offset_millis: lastAlert.route_offset_millis,
          end_route_offset_millis: ev.route_offset_millis,
          alertStatus: lastAlert.data.alertStatus,
        } as AlertTimelineEvent)
        lastAlert = undefined
      }
      if (!lastAlert && alertStatus !== 0) {
        lastAlert = ev
      }

      if (lastOverride && !isOverriding(ev.data.state)) {
        res.push({
          type: 'overriding',
          route_offset_millis: lastOverride.route_offset_millis,
          end_route_offset_millis: ev.route_offset_millis,
        } as OverridingTimelineEvent)
        lastOverride = undefined
      }
      if (!lastOverride && isOverriding(state)) {
        lastOverride = ev
      }
    } else if (ev.type === 'user_flag') {
      res.push({
        type: 'user_flag',
        route_offset_millis: ev.route_offset_millis,
      })
    }
  })

  // ensure events have an end timestamp
  if (lastEngaged) {
    res.push({
      type: 'engaged',
      route_offset_millis: lastEngaged.route_offset_millis,
      end_route_offset_millis: routeDuration,
    })
  }
  if (lastAlert) {
    res.push({
      type: 'alert',
      route_offset_millis: lastAlert.route_offset_millis,
      end_route_offset_millis: routeDuration,
      alertStatus: lastAlert.data.alertStatus,
    })
  }
  if (lastOverride) {
    res.push({
      type: 'overriding',
      route_offset_millis: lastOverride.route_offset_millis,
      end_route_offset_millis: routeDuration,
    })
  }

  return res
}

export const getTimelineEvents = (route: Route): Promise<TimelineEvent[]> =>
  getDriveEvents(route).then((events) => generateTimelineEvents(route, events))

export const generateRouteStatistics = (route: Route | undefined, timeline: TimelineEvent[], coords?: GPSPathPoint[]): RouteStatistics => {
  let engagedDurationMs = 0
  let userFlags = 0
  timeline.forEach((ev) => {
    if (ev.type === 'engaged') engagedDurationMs += ev.end_route_offset_millis - ev.route_offset_millis
    else if (ev.type === 'user_flag') userFlags += 1
  })
  const routeDurationMs = getRouteDuration(route)?.asMilliseconds() ?? 0
  let engagedDistanceRatio: number | undefined
  if (coords && coords.length > 1) {
    const engEvents = timeline.filter((e) => e.type === 'engaged') as EngagedTimelineEvent[]
    let engDist = 0,
      totDist = 0
    for (let i = 1; i < coords.length; i++) {
      const segDist = Math.max(coords[i].dist - coords[i - 1].dist, 0) || coords[i].dist
      if (segDist <= 0) continue
      totDist += segDist
      const tMs = coords[i].t * 1000
      if (engEvents.some((e) => tMs >= e.route_offset_millis && tMs <= e.end_route_offset_millis)) engDist += segDist
    }
    if (totDist > 0) engagedDistanceRatio = engDist / totDist
  }
  return { routeDurationMs, engagedDurationMs, engagedDistanceRatio, userFlags }
}

export const getRouteStatistics = async (route: Route): Promise<RouteStatistics> => {
  const [timeline, coords] = await Promise.all([getTimelineEvents(route), getCoords(route)])
  return generateRouteStatistics(route, timeline, coords)
}

export const getRouteStatisticsEventsOnly = async (route: Route): Promise<RouteStatistics> => {
  const timeline = await getTimelineEvents(route)
  return generateRouteStatistics(route, timeline)
}

export interface ReportCardRouteData {
  route: Route
  timeline: TimelineEvent[]
  coords: GPSPathPoint[]
  stats: RouteStatistics
  engagedStreaks: number[]
  engagedDistanceRatio: number
  overrideCount: number
  overridingMs: number
  disengagementCount: number
}

export interface ReportCardData {
  routes: ReportCardRouteData[]
  totalDistanceMi: number
  totalDurationMs: number
  totalEngagedMs: number
  totalDisengagements: number
  totalOverrides: number
  totalOverridingMs: number
  longestStreakMs: number
  avgStreakMs: number
  engagementRateTime: number
  engagementRateDistance: number
}

const computeRouteReportData = (route: Route, timeline: TimelineEvent[], coords: GPSPathPoint[]): ReportCardRouteData => {
  const stats = generateRouteStatistics(route, timeline)
  const engagedEvents = timeline.filter((e) => e.type === 'engaged') as EngagedTimelineEvent[]
  const overridingEvents = timeline.filter((e) => e.type === 'overriding') as OverridingTimelineEvent[]
  const engagedStreaks = engagedEvents.map((e) => e.end_route_offset_millis - e.route_offset_millis)
  const lastEngaged = engagedEvents.at(-1)
  let disengagementCount = engagedEvents.length > 0 ? engagedEvents.length - 1 : 0
  if (lastEngaged && lastEngaged.end_route_offset_millis < stats.routeDurationMs - 1000) disengagementCount++
  const overridingMs = overridingEvents.reduce((sum, e) => sum + (e.end_route_offset_millis - e.route_offset_millis), 0)
  let engagedDistanceRatio = stats.routeDurationMs > 0 ? stats.engagedDurationMs / stats.routeDurationMs : 0
  if (coords.length > 1) {
    let engDist = 0,
      totDist = 0
    for (let i = 1; i < coords.length; i++) {
      const segDist = Math.max(coords[i].dist - coords[i - 1].dist, 0) || coords[i].dist
      if (segDist <= 0) continue
      totDist += segDist
      const tMs = coords[i].t * 1000
      if (engagedEvents.some((e) => tMs >= e.route_offset_millis && tMs <= e.end_route_offset_millis)) engDist += segDist
    }
    if (totDist > 0) engagedDistanceRatio = engDist / totDist
  }
  return {
    route,
    timeline,
    coords,
    stats,
    engagedStreaks,
    engagedDistanceRatio,
    overrideCount: overridingEvents.length,
    overridingMs,
    disengagementCount,
  }
}

export const getReportCardData = async (routes: Route[]): Promise<ReportCardData> => {
  const routeData = await Promise.all(
    routes.map(async (route) => {
      const [timeline, coords] = await Promise.all([getTimelineEvents(route), getCoords(route)])
      return computeRouteReportData(route, timeline, coords)
    }),
  )
  return aggregateReportCard(routeData)
}

export const streamReportCardData = async (routes: Route[], onProgress: (data: ReportCardData) => void): Promise<ReportCardData> => {
  const processed: ReportCardRouteData[] = []
  for (const route of routes) {
    const [timeline, coords] = await Promise.all([getTimelineEvents(route), getCoords(route)])
    processed.push(computeRouteReportData(route, timeline, coords))
    onProgress(aggregateReportCard(processed))
  }
  return aggregateReportCard(processed)
}

export type EngagementHover =
  | { type: 'segment'; id: number; category: string; offsetInCategory?: number; durationMs?: number }
  | { type: 'category'; category: string }
  | null

export const aggregateReportCard = (routeData: ReportCardRouteData[]): ReportCardData => {
  const allStreaks = routeData.flatMap((r) => r.engagedStreaks)
  const sum = (fn: (r: ReportCardRouteData) => number) => routeData.reduce((s, r) => s + fn(r), 0)
  const totalDurationMs = sum((r) => r.stats.routeDurationMs)
  const totalEngagedMs = sum((r) => r.stats.engagedDurationMs)
  const totalDistanceMi = sum((r) => r.route.distance || 0)
  const engagedDistanceMi = sum((r) => (r.route.distance || 0) * r.engagedDistanceRatio)
  return {
    routes: routeData,
    totalDistanceMi,
    totalDurationMs,
    totalEngagedMs,
    totalDisengagements: sum((r) => r.disengagementCount),
    totalOverrides: sum((r) => r.overrideCount),
    totalOverridingMs: sum((r) => r.overridingMs),
    longestStreakMs: allStreaks.length > 0 ? Math.max(...allStreaks) : 0,
    avgStreakMs: allStreaks.length > 0 ? allStreaks.reduce((a, b) => a + b, 0) / allStreaks.length : 0,
    engagementRateTime: totalDurationMs > 0 ? totalEngagedMs / totalDurationMs : 0,
    engagementRateDistance: totalDistanceMi > 0 ? engagedDistanceMi / totalDistanceMi : 0,
  }
}
