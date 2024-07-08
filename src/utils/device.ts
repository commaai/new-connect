import type { Device } from '~/types'

export function getDeviceName(device: Device | undefined) {
  if(!device) return ''
  if (device.alias) return device.alias
  return `comma ${device.device_type}`
}
