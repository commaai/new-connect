import dayjs, { type Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import duration, { type Duration } from 'dayjs/plugin/duration'

import type { Route } from '~/types'

dayjs.extend(customParseFormat)
dayjs.extend(duration)

export const formatDistance = (miles: number | undefined): number => {
  if (miles === undefined) return 0
  return parseFloat(miles.toFixed(1)) ?? 0
}

export const formatRouteDistance = (route: Route | undefined): number => {
  if (route?.length === undefined) return 0
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

export const formatRouteDuration = (duration: Duration | undefined): string => {
  if (!duration) return ''
  return duration ? _formatDuration(duration) : ''
}

export const parseDateStr = (dateStr: string): Dayjs => {
  return dayjs(dateStr, 'YYYY-MM-DD--HH-mm-ss')
}
