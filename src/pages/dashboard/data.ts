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

const [currentDongleId, setCurrentDongleId] = createSignal<string>()
export { currentDongleId, setCurrentDongleId }

const [currentDevice, { refetch: _refetchCurrentDevice }] = createResource(currentDongleId, (dongleId) => {
  const device = resolved(devices) ? devices.latest.find((device) => device.dongle_id === dongleId) : undefined
  if (device) return device
  return getDevice(dongleId)
})
const refetchCurrentDevice = () => {
  const dongleId = currentDongleId()
  if (!dongleId) return
  if (resolved(devices) && devices.latest.some((device) => device.dongle_id === dongleId)) return refetchDevices()
  return _refetchCurrentDevice()
}
export { currentDevice, refetchCurrentDevice }

export const [selectedDeviceName] = createResource(currentDevice, getDeviceName)
