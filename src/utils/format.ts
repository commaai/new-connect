import dayjs from 'dayjs'
import advanced from 'dayjs/plugin/advancedFormat'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import duration, { type Duration } from 'dayjs/plugin/duration'

import type { Route } from '~/api/types'

dayjs.extend(advanced)
dayjs.extend(customParseFormat)
dayjs.extend(duration)

export { dayjs }

const MI_TO_KM = 1.609344

const isImperial = (): boolean => {
  if (typeof navigator === 'undefined') return true
  const locale = navigator.language.toLowerCase()
  return locale.startsWith('en-us') || locale.startsWith('en-gb')
}

export const formatDistance = (miles: number | undefined): string | undefined => {
  if (miles === undefined) return undefined
  if (isImperial()) return `${miles.toFixed(1)} mi`
  return `${(miles * MI_TO_KM).toFixed(1)} km`
}

const _formatDuration = (duration: Duration): string => {
  if (duration.hours() > 0) {
    return duration.format('H [hr] m [min]')
  } else {
    return duration.format('m [min]')
  }
}

export const formatDuration = (minutes: number | undefined): string | undefined => {
  if (minutes === undefined) return undefined
  const duration = dayjs.duration({
    hours: Math.floor(minutes / 60),
    minutes: Math.round(minutes % 60),
  })
  return _formatDuration(duration)
}

export const formatVideoTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60).toString()
  const remainingSeconds = Math.floor(seconds % 60).toString()
  if (hours > 0) return `${hours}:${minutes.padStart(2, '0')}:${remainingSeconds.padStart(2, '0')}`
  return `${minutes}:${remainingSeconds.padStart(2, '0')}`
}

export const getRouteDuration = (route: Route | undefined): Duration | undefined => {
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
    return dayjs.unix(input >= 1e11 ? input / 1000 : input)
  }
  return dayjs(input)
}

export const formatDate = (input: dayjs.ConfigType): string => {
  const date = parseTimestamp(input)
  // Hide current year
  const yearStr = date.year() === dayjs().year() ? '' : ', YYYY'
  return date.format('MMMM Do' + yearStr)
}

export const dateTimeToColorBetween = (startTime: Date, startColor: number[], endColor: number[]): string => {
  const sunrise = 6.5 // safe estimate year-round
  const sunset = 6 + 12 // FIXME: average is 6:30, but it's better to false positive night than day
  const twilight = 0.5 // civil twilight is when it gets dark

  const hours = startTime.getHours() + startTime.getMinutes() / 60

  let blendFactor = 0
  if (sunrise < hours && hours < sunrise + twilight) blendFactor = (hours - sunrise) / twilight
  else if (sunset < hours && hours < sunset + twilight) blendFactor = 1 - (hours - sunset) / twilight
  else if (sunrise < hours && hours < sunset + twilight) blendFactor = 1

  const blended = startColor.map((c, i) => c + (endColor[i] - c) * blendFactor)
  return `rgb(${blended.join(', ')})`
}
