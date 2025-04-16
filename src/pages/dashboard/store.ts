import { createMemo, createResource, createSignal } from 'solid-js'

import { accessToken } from '~/api/auth/client'
import { getDevice, getDevices } from '~/api/devices'
import { getProfile } from '~/api/profile'
import { getDeviceName } from '~/utils/device'
import { resolved } from '~/utils/reactivity'

export const [profile] = createResource(accessToken, getProfile)

export const [devices, { refetch: refetchDevices }] = createResource(accessToken, getDevices)

export const [currentDongleId, setCurrentDongleId] = createSignal<string>()

const [currentDevice, { refetch: _refetchCurrentDevice }] = createResource(
  () => {
    const dongleId = currentDongleId()
    if (!dongleId) return null
    return { dongleId, devices: resolved(devices) ? devices.latest : null }
  },
  ({ dongleId, devices }) => {
    const device = devices?.find((device) => device.dongle_id === dongleId)
    if (device) return device
    return getDevice(dongleId)
  },
)
const refetchCurrentDevice = () => {
  const dongleId = currentDongleId()
  if (!dongleId) return
  if (resolved(devices) && devices.latest?.some((device) => device.dongle_id === dongleId)) {
    refetchDevices()
    return
  }
  _refetchCurrentDevice()
}
export { currentDevice, refetchCurrentDevice }

export const currentDeviceName = createMemo(() => {
  const device = currentDevice()
  if (!device) return ''
  return getDeviceName(device)
})
