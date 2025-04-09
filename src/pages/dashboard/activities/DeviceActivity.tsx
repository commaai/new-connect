import { createSignal, For, Show, Suspense, type VoidComponent } from 'solid-js'
import { createStore } from 'solid-js/store'
import { queryOptions } from '@tanstack/solid-query'
import clsx from 'clsx'

import { takeSnapshot } from '~/api/athena'
import { getDevice, getDevices } from '~/api/devices'
import { DrawerToggleButton, useDrawerContext } from '~/components/material/Drawer'
import Icon from '~/components/material/Icon'
import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'
import DeviceLocation from '~/components/DeviceLocation'
import DeviceStatistics from '~/components/DeviceStatistics'
import UploadQueue from '~/components/UploadQueue'
import { deviceIsOnline, getDeviceName } from '~/utils/device'

import RouteList from '../components/RouteList'
import { Device } from '~/api/types'

type DeviceActivityProps = {
  device: Device
}

export const queries = {
  device: ['device'],
  allDevices: () => [...queries.device],
  forDevice: (dongleId: string) => [...queries.device, 'dongle', dongleId],
  getDevice: (dongleId: string) => queryOptions({ queryKey: queries.forDevice(dongleId), queryFn: () => getDevice(dongleId) }),
  getAllDevices: () => queryOptions({ queryKey: queries.allDevices(), queryFn: getDevices }),
}

const DeviceActivity: VoidComponent<DeviceActivityProps> = (props) => {
  const deviceName = () => getDeviceName(props.device)

  const [queueVisible, setQueueVisible] = createSignal(false)
  const [snapshot, setSnapshot] = createStore<{
    error: string | null
    fetching: boolean
    images: string[]
  }>({
    error: null,
    fetching: false,
    images: [],
  })

  const onClickSnapshot = async () => {
    setSnapshot({ error: null, fetching: true })
    try {
      const resp = await takeSnapshot(props.device.dongle_id)
      const images = [resp.result?.jpegFront, resp.result?.jpegBack].filter((it) => it !== undefined)
      if (images.length > 0) {
        setSnapshot('images', images)
      } else {
        throw new Error('No images found.')
      }
    } catch (err) {
      let error = (err as Error).message
      if (error.includes('Device not registered')) {
        error = 'Device offline'
      }
      setSnapshot('error', error)
    } finally {
      setSnapshot('fetching', false)
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
    const newImages = snapshot.images.filter((_, i) => i !== index)
    setSnapshot('images', newImages)
  }

  const clearError = () => setSnapshot('error', null)

  const { modal } = useDrawerContext()

  return (
    <>
      <TopAppBar
        class="font-bold"
        leading={
          <Show when={!modal()} fallback={<DrawerToggleButton />}>
            <img alt="" src="/images/comma-white.png" class="h-8" />
          </Show>
        }
      >
        connect
      </TopAppBar>
      <div class="flex flex-col gap-4 px-4 pb-4">
        <div class="h-min overflow-hidden rounded-lg bg-surface-container-low">
          <Suspense fallback={<div class="h-[240px] skeleton-loader size-full" />}>
            <DeviceLocation dongleId={props.device.dongle_id} deviceName={deviceName()!} />
          </Suspense>
          <div class="flex items-center justify-between p-4">
            <Suspense fallback={<div class="h-[32px] skeleton-loader size-full rounded-xs" />}>
              <div class="inline-flex items-center gap-2">
                <div class={clsx('m-2 size-2 shrink-0 rounded-full', deviceIsOnline(props.device) ? 'bg-green-400' : 'bg-gray-400')} />

                {<div class="text-xl font-bold">{deviceName()}</div>}
              </div>
            </Suspense>
            <div class="flex gap-4">
              <IconButton name="camera" onClick={onClickSnapshot} />
              <IconButton name="settings" href={`/${props.device.dongle_id}/settings`} />
            </div>
          </div>
          <Show when={true}>
            {' '}
            {/* FIXME: isDeviceUser() */}
            <DeviceStatistics dongleId={props.device.dongle_id} class="p-4" />
            <Show when={queueVisible()}>
              <UploadQueue dongleId={props.device.dongle_id} />
            </Show>
            <button
              class={clsx(
                'flex w-full cursor-pointer justify-center rounded-b-lg bg-surface-container-lowest p-2',
                queueVisible() && 'border-t-2 border-t-surface-container-low',
              )}
              onClick={() => setQueueVisible(!queueVisible())}
            >
              <p class="mr-2">Upload Queue</p>
              <Icon class="text-zinc-500" name={queueVisible() ? 'keyboard_arrow_up' : 'keyboard_arrow_down'} />
            </button>
          </Show>
        </div>
        <div class="flex flex-col gap-2">
          <For each={snapshot.images}>
            {(image, index) => (
              <div class="flex-1 overflow-hidden rounded-lg bg-surface-container-low">
                <div class="relative p-4">
                  <img src={`data:image/jpeg;base64,${image}`} alt={`Device Snapshot ${index() + 1}`} />
                  <div class="absolute right-4 top-4 p-4">
                    <IconButton class="text-white" name="download" onClick={() => downloadSnapshot(image, index())} />
                    <IconButton class="text-white" name="clear" onClick={() => clearImage(index())} />
                  </div>
                </div>
              </div>
            )}
          </For>
          <Show when={snapshot.fetching}>
            <div class="flex-1 overflow-hidden rounded-lg bg-surface-container-low">
              <div class="p-4">
                <div>Loading snapshots...</div>
              </div>
            </div>
          </Show>
          <Show when={snapshot.error}>
            <div class="flex-1 overflow-hidden rounded-lg bg-surface-container-low">
              <div class="flex items-center p-4">
                <IconButton class="text-white" name="clear" onClick={clearError} />
                <span>Error: {snapshot.error}</span>
              </div>
            </div>
          </Show>
        </div>
        <RouteList dongleId={props.device.dongle_id} />
      </div>
    </>
  )
}

export default DeviceActivity
