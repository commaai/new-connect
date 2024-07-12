import type { DeviceWithFetchedAt } from '~/types'

export function getDeviceName(device: DeviceWithFetchedAt) {
  if (device.alias) return device.alias
  return `comma ${device.device_type}`
}

export function deviceIsOnline(device: DeviceWithFetchedAt) {
  if (!device.last_athena_ping) return false
  return device.last_athena_ping >= (device.fetched_at - 120)
}
