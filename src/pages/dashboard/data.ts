import { createMemo, createResource, createSignal } from 'solid-js'

import { accessToken } from '~/api/auth/client'
import { getDevice, getDevices } from '~/api/devices'
import { getProfile } from '~/api/profile'
import { getDeviceName } from '~/utils/device'
import { resolved } from '~/utils/reactivity'

export const [profile] = createResource(accessToken, getProfile)

export const [devices, { refetch: refetchDevices }] = createResource(accessToken, getDevices, { initialValue: [] })

export const [currentDongleId, setCurrentDongleId] = createSignal<string>()

export const [currentDevice] = createResource(
  () => ({ dongleId: currentDongleId(), devices: resolved(devices) ? devices.latest : undefined }),
  ({ dongleId, devices }) => {
    if (!dongleId) return undefined
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
