import { createResource, Show } from 'solid-js'
import { Navigate } from 'solid-start'

import { getDevices } from '~/api/devices'
import { Device } from '~/types'

export default function DeviceRedirect() {
  const [devices] = createResource(getDevices)

  return (
    <Show when={devices()} keyed>
      {(devices: Device[]) => <Navigate href={`/${devices[0].dongle_id}`} />}
    </Show>
  )
}
