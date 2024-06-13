import dayjs, { type Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import duration, { type Duration } from 'dayjs/plugin/duration'

import type { Route } from '~/types'

dayjs.extend(customParseFormat)
dayjs.extend(duration)

export const formatDistance = (miles: number | undefined): string => {
  if (miles === undefined) return ''
  return `${miles.toFixed(1) ?? 0} mi`
}

export const formatRouteDistance = (route: Route | undefined): string => {
  if (route?.length === undefined) return ''
  return formatDistance(route.length)
}

const _formatDuration = (duration: Duration): string => {
  if (duration.asHours() > 0) {
    return duration.format('H[h] m[m]')
  } else {
    return duration.format('m[m]')
  }
}

export const formatDuration = (minutes: number | undefined): string => {
  if (minutes === undefined) return ''
  const duration = dayjs.duration({
    hours: Math.floor(minutes / 60),
    minutes: minutes % 60,
  })
  return _formatDuration(duration)
}

export const getRouteDuration = (route: Route): Duration | undefined => {
  if (!route || !route.end_time) return undefined
  const startTime = dayjs(route.start_time)
  const endTime = dayjs(route.end_time)
  return dayjs.duration(endTime.diff(startTime))
}

export const formatRouteDuration = (route: Route | undefined): string => {
  if (!route) return ''
  const duration = getRouteDuration(route)
  return duration ? _formatDuration(duration) : ''
}

export const parseDateStr = (dateStr: string): Dayjs => {
  return dayjs(dateStr, 'YYYY-MM-DD--HH-mm-ss')
}
