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

class EsriAddress {
  Match_addr?: string
}

class EsriGeocodeResponse {
  address?: EsriAddress
}

export async function reverseGeocode (lat: number, lng: number) {
  const response = await fetch(
    `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=${lng},${lat}&f=json`,
  )

  if (!response.ok) {
    throw new Error(`Error fetching address: ${response.status}`)
  }

  const data: EsriGeocodeResponse = await response.json() as EsriGeocodeResponse
  return data.address?.Match_addr || 'Unknown address'
}

export function deviceIsOnline(device: Device) {
  return !!(device.last_athena_ping) && (device.last_athena_ping >= (device.fetched_at - 120))
}
