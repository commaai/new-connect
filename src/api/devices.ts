import { z } from 'zod'

import type { Device, DrivingStatistics } from '~/types'

import { fetcher } from '.'

const sortDevices = (devices: Device[]) => {
  return devices.sort((a, b) => {
    if (a.is_owner !== b.is_owner) {
      return a.is_owner ? -1 : 1
    } else if (a.alias && b.alias) {
      return a.alias.localeCompare(b.alias)
    } else if (!a.alias && !b.alias) {
      return a.dongle_id.localeCompare(b.dongle_id)
    } else {
      return a.alias ? -1 : 1
    }
  })
}

export const getDevice = async (dongleId: string) =>
  fetcher<Device>(`/v1.1/devices/${dongleId}/`)

export const getDeviceStats = async (dongleId: string) =>
  fetcher<DrivingStatistics>(`/v1.1/devices/${dongleId}/stats`)

export const getDevices = async () =>
  fetcher<Device[]>('/v1/me/devices/')
    .then(devices => sortDevices(devices))
    .catch(() => [])

const PairTokenPayloadSchema = z.object({
  pair: z.literal(true),
  identity: z.string().regex(/^[0-9a-f]{16}$/),
})

const validatePairToken = (input: string): string | false => {
  if (!input) return false
  const parts = input.split('.')
  if (parts.length !== 3) return false
  try {
    // jwt is base64url encoded
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    const { identity } = PairTokenPayloadSchema.parse(JSON.parse(payload))
    return identity
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    return false
  }
}

export const pairDevice = async (pairToken: string) => {
  let dongleId
  if (!(dongleId = validatePairToken(pairToken))) {
    throw new Error('invalid qr code')
  }

  const body = new FormData()
  body.append('pair_token', pairToken)
  try {
    await fetcher('/v2/pilotpair/', {
      method: 'POST',
      body,
    })
    return dongleId
  } catch (error) {
    if (!(error instanceof Error) || !(error.cause instanceof Response)) {
      throw error
    }
    const msg = {
      400: 'invalid request',
      401: 'could not decode token - make sure your comma device is connected to the internet',
      403: 'device paired with different owner - make sure you signed in with the correct account',
      404: 'tried to pair invalid device',
      417: 'pair token not true',
    }[error.cause.status] ?? 'unable to pair'
    throw new Error(msg, { cause: error.cause })
  }
}
