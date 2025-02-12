import dayjs from 'dayjs'
import advanced from 'dayjs/plugin/advancedFormat'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import duration, { type Duration } from 'dayjs/plugin/duration'

import type { Route } from '~/types'

dayjs.extend(advanced)
dayjs.extend(customParseFormat)
dayjs.extend(duration)

export { dayjs }

export const formatDistance = (miles: number | undefined): string => {
  if (miles === undefined) return ''
  return `${miles.toFixed(1)} mi`
}

const _formatDuration = (duration: Duration): string => {
  if (duration.hours() > 0) {
    return duration.format('H[h] m[m]')
  } else {
    return duration.format('m[m]')
  }
}

export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
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

const parseTimestamp = (input: dayjs.ConfigType): dayjs.Dayjs => {
  if (typeof input === 'number') {
    // Assume number is unix timestamp, convert to seconds
    return dayjs.unix(input >= 1E11 ? input / 1000 : input)
  }
  return dayjs(input)
}

export const formatDate = (input: dayjs.ConfigType): string => {
  const date = parseTimestamp(input)
  // Hide current year
  const yearStr = date.year() === dayjs().year() ? '' : ', YYYY'
  return date.format('MMMM Do' + yearStr)
}
