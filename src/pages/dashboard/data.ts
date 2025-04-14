import { createMemo, createResource, createSignal } from 'solid-js'

import { accessToken } from '~/api/auth/client'
import { getDevice, getDevices } from '~/api/devices'
import { getProfile } from '~/api/profile'
import { getDeviceName } from '~/utils/device'
import { resolved } from '~/utils/reactivity'

export const [profile, { refetch: refetchProfile }] = createResource(accessToken, () => getProfile().catch(() => undefined))

export const [devices, { refetch: refetchDevices }] = createResource(accessToken, getDevices)

export const [currentDongleId, setCurrentDongleId] = createSignal<string>()

const [currentDevice, { refetch: _refetchCurrentDevice }] = createResource(currentDongleId, (dongleId) => {
  const device = resolved(devices) ? devices().find((device) => device.dongle_id === dongleId) : undefined
  if (device) return device
  return getDevice(dongleId)
})
const refetchCurrentDevice = () => {
  const dongleId = currentDongleId()
  if (!dongleId) return
  if (resolved(devices) && devices().some((device) => device.dongle_id === dongleId)) return refetchDevices()
  return _refetchCurrentDevice()
}
export { currentDevice, refetchCurrentDevice }

export const currentDeviceName = createMemo(() => {
  const device = currentDevice()
  if (!device) return ''
  return getDeviceName(device)
})
