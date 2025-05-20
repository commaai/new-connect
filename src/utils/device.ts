import type { Device } from '~/api/types'

function deviceTypePretty(device: Device) {
  switch (device.device_type) {
    case 'threex':
      return 'comma 3X'
    case 'neo':
      return 'EON'
    case 'freon':
      return 'freon'
    case 'unknown':
      return 'unknown'
    default:
      return `comma ${device.device_type}`
  }
}

export function getDeviceName(device: Device) {
  if (device.alias) return device.alias
  return deviceTypePretty(device)
}
