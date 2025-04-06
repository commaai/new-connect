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

function l(t: number) {
  // these are averages throughout the year in San Diego
  // TODO: calculate correct times based on route date
  const sunrise = 6.5
  const sunset = 6.5 + 12
  const twilight = 0.5  // civil twilight is 25 minutes on average
  // looked outside and it got dark at 7:40 (sunset was 7:11)
  // t = t + 1

  if ((sunrise < t) && (t < (sunrise + twilight))) return (t - sunrise) / twilight
  if ((sunset < t) && (t < (sunset + twilight))) return 1 - (t - sunset) / twilight
  if ((sunrise < t) && (t < (sunset + twilight))) return 1

  // const startTime = 6.5
  // const endTime = 6 + 12
  // const fadeHours = 0.5
  // if ((startTime < t) && (t < (startTime + fadeHours))) return (t - startTime) / fadeHours
  // if ((endTime < t) && (t < (endTime + fadeHours))) return 1 - (t - endTime) / fadeHours
  // if ((startTime < t) && (t < (endTime + fadeHours))) return 1
  // // if ((startTime + 2) < t && t < endTime) return 1

  // if (t < 6) return 0
  // if (t > (7.5 + 12)) return 0
  // if (t < 8) return Math.min((t - 5)/2, 1)
  // if (t > 18) return 1-Math.min((t - 17), 1)
  return 0
  // return 1 / (1 + Math.exp(-2 * (t - 6))) - 1 / (1 + Math.exp(-2 * (t - 19)));
}

export const dateTimeToColorBetween = (startTime: Date, endTime: Date, startColor: string, endColor: string): { start: string; end: string } => {
  const toRGB = (hex: string): number[] => hex.match(/\w\w/g)!.map((x) => parseInt(x, 16))
  const toHex = (rgb: number[]): string => rgb.map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')

  const hoursStart = startTime.getHours() + startTime.getMinutes() / 60
  const hoursEnd = endTime.getHours() + endTime.getMinutes() / 60
  const hoursAvg = hoursEnd  // (hoursStart + hoursEnd) / 2
  // const minutes = startTime.getHours() * 60 + startTime.getMinutes()
  // const t = minutes / 720
  // const blendFactor = t <= 1 ? t : 2 - t
  // const blendFactor = Math.max(Math.min(Math.sin(Math.PI / 14 * (hours - 5)), 1), 0)
  const blendFactorStart = l(hoursStart)
  const blendFactorEnd = l(hoursEnd)
  const blendFactorAvg = l(hoursAvg)
  console.log('hoursStart', hoursStart, 'hoursEnd', hoursEnd, 'hoursAvg', hoursAvg, blendFactorAvg)

  const rgb1 = toRGB(startColor)
  const rgb2 = toRGB(endColor)
  // const blended = rgb1.map((c, i) => c + (rgb2[i] - c) * blendFactor)
  const blendedStart = rgb1.map((c, i) => c + (rgb2[i] - c) * blendFactorStart)
  const blendedEnd = rgb1.map((c, i) => c + (rgb2[i] - c) * blendFactorEnd)
  const blendedAvg = rgb1.map((c, i) => c + (rgb2[i] - c) * blendFactorAvg)

  // const start = `#${toHex(blendedStart)}`
  // const end = `#${toHex(blendedEnd)}`
  const avg = `#${toHex(blendedAvg)}`
  return {start: avg, end: avg}
  // return `#${toHex(blended)}`
}
