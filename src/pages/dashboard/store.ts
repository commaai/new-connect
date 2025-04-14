import { createMemo, createResource, createSignal } from 'solid-js'

import { accessToken } from '~/api/auth/client'
import { getDevice, getDevices } from '~/api/devices'
import { getProfile } from '~/api/profile'
import { getDeviceName } from '~/utils/device'

export const [profile] = createResource(accessToken, getProfile)

export const [devices, { refetch: refetchDevices }] = createResource(accessToken, getDevices)

export const [currentDongleId, setCurrentDongleId] = createSignal<string>()

export const [currentDevice] = createResource(
  () => {
    const dongleId = currentDongleId()
    if (!dongleId) return null
    return { dongleId, devices: devices.latest }
  },
  ({ dongleId, devices }) => {
    const device = devices?.find((device) => device.dongle_id === dongleId)
    if (device) return device
    return getDevice(dongleId)
  },
)

export const currentDeviceName = createMemo(() => {
  const device = currentDevice()
  if (!device) return ''
  return getDeviceName(device)
})
