import { createMemo, createResource, type Signal } from 'solid-js'
import { createStore, reconcile, unwrap } from 'solid-js/store'

import { accessToken } from '~/api/auth/client'
import { getDevice, getDevices } from '~/api/devices'
import { getProfile } from '~/api/profile'
import type { Device, Profile } from '~/api/types'
import { getDeviceName } from '~/utils/device'

interface State {
  profile?: Profile
  devices?: Device[]
  currentDongleId?: string
  currentDevice?: Device
}

const [state, setState] = createStore<State>()

const createStorage =
  <K extends keyof State>(key: K) =>
  <T extends State[K]>(value: T): Signal<T> => {
    setState(key, value)
    return [
      () => state[key],
      (v: T | ((prev: T) => T)) => {
        const unwrapped = unwrap(state[key]) as T
        if (typeof v === 'function') v = v(unwrapped)
        setState(key, reconcile(v))
        return state[key]
      },
    ] as Signal<T>
  }

export const [profile, { refetch: refetchProfile }] = createResource(accessToken, getProfile, {
  storage: createStorage('profile'),
})

export const [devices, { refetch: refetchDevices }] = createResource(accessToken, getDevices, {
  storage: createStorage('devices'),
})

export const currentDongleId = () => state.currentDongleId
export const setCurrentDongleId = (dongleId: string | undefined) => {
  setState('currentDongleId', dongleId)
}

const [currentDevice, { refetch: _refetchCurrentDevice }] = createResource(currentDongleId, (dongleId) => {
  const device = state.devices?.find((device) => device.dongle_id === dongleId)
  if (device) return device
  return getDevice(dongleId)
})
const refetchCurrentDevice = () => {
  const dongleId = state.currentDongleId
  if (!dongleId) return
  if (state.devices?.some((device) => device.dongle_id === dongleId)) return refetchDevices()
  return _refetchCurrentDevice()
}
export { currentDevice, refetchCurrentDevice }

export const currentDeviceName = createMemo(() => {
  const device = currentDevice()
  return device ? getDeviceName(device) : ''
})
