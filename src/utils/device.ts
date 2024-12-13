import type { Device } from '~/types'
import dayjs from 'dayjs'

export function getDeviceName(device: Device) {
  if (device.alias) return device.alias
  return `comma ${device.device_type}`
}

export function getDeviceLastSeen(device: Device) {
  if (device.last_gps_time) {
    const lastSeenTime = dayjs(device.last_gps_time)
    return lastSeenTime.fromNow()
  }
  return 'Never'
}

export function deviceIsOnline(device: Device) {
  return !!(device.last_athena_ping) && (device.last_athena_ping >= (device.fetched_at - 120))
}
