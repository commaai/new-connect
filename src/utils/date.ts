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

export const formatRouteDuration = (route: Route | undefined): string => {
  if (!route || !route.segment_start_times || !route.segment_end_times)
    return ''

  const startTime = dayjs(route.segment_start_times[0])
  const endTime = dayjs(
    route.segment_end_times[route.segment_end_times.length - 1],
  )
  const duration = dayjs.duration(endTime.diff(startTime))
  return _formatDuration(duration)
}

export const parseDateStr = (dateStr: string): Dayjs => {
  return dayjs(dateStr, 'YYYY-MM-DD--HH-mm-ss')
}
