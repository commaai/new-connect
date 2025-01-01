import { createResource, Suspense, useContext, createSignal, For } from 'solid-js'
import type { VoidComponent } from 'solid-js'

import { getDevice } from '~/api/devices'
import { ATHENA_URL } from '~/api/config'
import { getAccessToken } from '~/api/auth/client'

import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'
import DeviceStatistics from '~/components/DeviceStatistics'
import { getDeviceName } from '~/utils/device'

import RouteList from '../components/RouteList'
import { DashboardContext } from '../Dashboard'

type DeviceActivityProps = {
  dongleId: string
}

interface SnapshotResponse {
  result?: {
    jpegFront?: string;
    jpegBack?: string;
  };
}

const DeviceActivity: VoidComponent<DeviceActivityProps> = (props) => {
  const { toggleDrawer } = useContext(DashboardContext)!

  const [device] = createResource(() => props.dongleId, getDevice)
  const [deviceName] = createResource(device, getDeviceName)
  const [snapshot, setSnapshot] = createSignal<{
    error: string | null
    fetching: boolean
    images: string[]
  }>({
    error: null,
    fetching: false,
    images: [],
  })

  const takeSnapshot = async () => {
    setSnapshot({ error: null, fetching: true, images: [] })

    try {
      const payload = {
        method: 'takeSnapshot',
        jsonrpc: '2.0',
        id: 0,
      }

      const response = await fetch(`${ATHENA_URL}/${props.dongleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${getAccessToken()}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const resp: SnapshotResponse = (await response.json()) as SnapshotResponse
      const images = []

      if (resp.result?.jpegFront) images.push(resp.result.jpegFront)
      if (resp.result?.jpegBack) images.push(resp.result.jpegBack)

      if (images.length > 0) {
        setSnapshot({ error: null, fetching: false, images })
      } else {
        throw new Error('No images found.')
      }

    } catch (err) {
      let error = (err as Error).message
      if (error.includes('Device not registered')) {
        error = 'Device offline'
      }
      setSnapshot({ error, fetching: false, images: [] })
    }
  }

  const downloadSnapshot = (image: string, index: number) => {
    const link = document.createElement('a')
    link.href = `data:image/jpeg;base64,${image}`
    link.download = `snapshot${index + 1}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const clearImage = (index: number) => {
    const newImages = snapshot().images.filter((_, i) => i !== index)
    setSnapshot({ ...snapshot(), images: newImages })
  }

  const clearError = () => {
    setSnapshot({ ...snapshot(), error: null })
  }

  return (
    <>
      <TopAppBar
        leading={<IconButton onClick={toggleDrawer}>menu</IconButton>}
        trailing={<IconButton href={`/${props.dongleId}/settings`}>settings</IconButton>}
      >
        {deviceName()}
      </TopAppBar>
      <div class="flex flex-col gap-4 px-4 pb-4">
        <div class="h-min overflow-hidden rounded-lg bg-surface-container-low">
          <div class="m-4 flex">
            <Suspense fallback={<div class="skeleton-loader size-full" />}>
              <DeviceStatistics dongleId={props.dongleId} />
            </Suspense>
            <div class="flex items-center">
              <IconButton onClick={() => void takeSnapshot()}>camera</IconButton>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <For each={snapshot().images}>
            {(image, index) => (
              <div class="flex-1 overflow-hidden rounded-lg bg-surface-container-low">
                <div class="relative p-4">
                  <img src={`data:image/jpeg;base64,${image}`} alt={`Device Snapshot ${index() + 1}`} />
                  <div class="absolute right-4 top-4 p-4">
                    <IconButton onClick={() => downloadSnapshot(image, index())} class="text-white">download</IconButton>
                    <IconButton onClick={() => clearImage(index())} class="text-white">clear</IconButton>
                  </div>
                </div>
              </div>
            )}
          </For>
          {snapshot().fetching && (
            <div class="flex-1 overflow-hidden rounded-lg bg-surface-container-low">
              <div class="p-4">
                <div>Loading snapshots...</div>
              </div>
            </div>
          )}
          {snapshot().error && (
            <div class="flex-1 overflow-hidden rounded-lg bg-surface-container-low">
              <div class="flex items-center p-4">
                <IconButton onClick={clearError} class="text-white">Clear</IconButton>
                <span>Error: {snapshot().error}</span>
              </div>
            </div>
          )}
        </div>
        <div class="flex flex-col gap-2">
          <span class="text-label-sm">Routes</span>
          <RouteList dongleId={props.dongleId} />
        </div>
      </div>
    </>
  )
}

export default DeviceActivity
