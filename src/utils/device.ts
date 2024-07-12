import type { Device, DeviceWithFetchedAt } from '~/types'

export function getDeviceName(device: Device) {
  if (device.alias) return device.alias
  return `comma ${device.device_type}`
}

// maybe also check for undefined?
export function deviceIsOnline(device: DeviceWithFetchedAt): Boolean {
  if (!device.last_athena_ping) return false;
  return device.last_athena_ping >= (device.fetched_at - 120);
}
