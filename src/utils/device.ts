import type { Device } from '~/api/types'

const SHARED_DEVICE = 'Shared Device'

export function getDeviceName(device: Device | undefined) {
  if (!device) return SHARED_DEVICE
  if (device.alias) return device.alias
  return `comma ${device.device_type}`
}

export function deviceIsOnline(device: Device) {
  return !!device.last_athena_ping && device.last_athena_ping >= device.fetched_at - 120
}
