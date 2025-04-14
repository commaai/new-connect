import { createResource, createSignal } from 'solid-js'

import { accessToken } from '~/api/auth/client'
import { getDevice, getDevices } from '~/api/devices'
import { getProfile } from '~/api/profile'
import { getDeviceName } from '~/utils/device'
import { resolved } from '~/utils/reactivity'

const [profile, { refetch: refetchProfile }] = createResource(accessToken, getProfile)
export { profile, refetchProfile }

const [devices, { refetch: refetchDevices }] = createResource(accessToken, getDevices)
export { devices, refetchDevices }

const [selectedDongleId, setSelectedDongleId] = createSignal<string>()
export { selectedDongleId, setSelectedDongleId }

const [selectedDevice, { refetch: _refetchSelectedDevice }] = createResource(selectedDongleId, (dongleId) => {
  const device = resolved(devices) ? devices.latest.find((device) => device.dongle_id === dongleId) : undefined
  if (device) return device
  return getDevice(dongleId)
})
const refetchSelectedDevice = () => {
  const dongleId = selectedDongleId()
  if (!dongleId) return
  if (resolved(devices) && devices.latest.some((device) => device.dongle_id === dongleId)) return refetchDevices()
  return _refetchSelectedDevice()
}
export { selectedDevice, refetchSelectedDevice }

export const [selectedDeviceName] = createResource(selectedDevice, getDeviceName)
