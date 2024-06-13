import type { Device } from '~/types'

export function getDeviceName(device: Device) {
  if (device.alias) return device.alias
  return `comma ${device.device_type}`
}
