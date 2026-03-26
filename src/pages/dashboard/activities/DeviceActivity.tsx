import { createResource, createSignal, For, Show, Suspense, type VoidComponent } from 'solid-js'
import { createStore } from 'solid-js/store'
import clsx from 'clsx'

import { takeSnapshot } from '~/api/athena'
import { getDevice, SHARED_DEVICE } from '~/api/devices'
import { DrawerToggleButton, useDrawerContext } from '~/components/material/Drawer'
import Icon from '~/components/material/Icon'
import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'
import DeviceLocation from '~/components/DeviceLocation'
import DeviceStatistics from '~/components/DeviceStatistics'
import UploadQueue from '~/components/UploadQueue'
import { dayjs } from '~/utils/format'
import { getDeviceName } from '~/utils/device'

import RouteList from '../components/RouteList'

type DeviceActivityProps = {
  dongleId: string
}

const DeviceActivity: VoidComponent<DeviceActivityProps> = (props) => {
  // TODO: device should be passed in from DeviceList
  const [device] = createResource(() => props.dongleId, getDevice)
  // Resource as source of another resource blocks component initialization
  const deviceName = () => (device.latest ? getDeviceName(device.latest) : '')
  // TODO: remove this. if we're listing the routes for a device you should always be a user, this is for viewing public routes which are being removed
  const isDeviceUser = () => (device.loading ? true : device.latest?.is_owner || device.latest?.alias !== SHARED_DEVICE)
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
      const resp = await takeSnapshot(props.dongleId)
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
  const onlineStatus = () => (device.latest?.is_online ? 'Online now' : 'Offline')
  const lastSeen = () => {
    const lastPing = device.latest?.last_athena_ping
    if (!lastPing) return 'Last seen unavailable'
    return `Last seen ${dayjs.unix(lastPing).format('MMM D, h:mm A')}`
  }
  const versionLabel = () => device.latest?.openpilot_version || 'Version unavailable'

  return (
    <>
      <TopAppBar
        class="font-bold"
        leading={
          <Show when={!modal()} fallback={<DrawerToggleButton />}>
            <img alt="new connect" src="/images/logo-connect-light.svg" class="h-8" />
          </Show>
        }
      >
        new connect
      </TopAppBar>
      <div class="flex flex-col gap-4 px-4 pb-4">
        <div class="h-min overflow-hidden rounded-lg bg-surface-container-low">
          <Suspense fallback={<div class="h-[240px] skeleton-loader size-full" />}>
            <DeviceLocation dongleId={props.dongleId} deviceName={deviceName()!} />
          </Suspense>
          <div class="flex items-center justify-between p-4">
            <Suspense fallback={<div class="h-[32px] skeleton-loader size-full rounded-xs" />}>
              <div class="flex flex-col gap-2">
                <div class="inline-flex items-center gap-2">
                  <div class={clsx('m-2 size-2 shrink-0 rounded-full', device.latest?.is_online ? 'bg-green-400' : 'bg-gray-400')} />
                  <div class="text-lg font-bold">{deviceName()}</div>
                </div>
                <div class="flex flex-wrap gap-2 text-xs text-on-surface-variant">
                  <span class="rounded-full bg-surface-container-high px-3 py-1">{onlineStatus()}</span>
                  <span class="rounded-full bg-surface-container-high px-3 py-1">{lastSeen()}</span>
                  <span class="rounded-full bg-surface-container-high px-3 py-1">{versionLabel()}</span>
                </div>
              </div>
            </Suspense>
            <div class="flex gap-4">
              <IconButton title="Take remote snapshot" name="camera" onClick={onClickSnapshot} />
              <IconButton title="Open device settings" name="settings" href={`/${props.dongleId}/settings`} />
            </div>
          </div>
          <Show when={isDeviceUser()}>
            <DeviceStatistics dongleId={props.dongleId} class="p-4" />
            <Show when={queueVisible()}>
              <UploadQueue dongleId={props.dongleId} />
            </Show>
            <button
              class={clsx(
                'flex w-full cursor-pointer items-center justify-center gap-2 rounded-b-lg bg-surface-container-lowest p-3 text-sm',
                queueVisible() && 'border-t-2 border-t-surface-container-low',
              )}
              onClick={() => setQueueVisible(!queueVisible())}
            >
              <p>{queueVisible() ? 'Hide upload status' : 'Show upload status'}</p>
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
              <div class="flex items-center gap-3 p-4 text-on-surface-variant">
                <Icon class="animate-spin" name="autorenew" size="20" />
                <div>Fetching latest snapshots...</div>
              </div>
            </div>
          </Show>
          <Show when={snapshot.error}>
            <div class="flex-1 overflow-hidden rounded-lg bg-surface-container-low">
              <div class="flex items-center gap-3 p-4">
                <Icon class="text-error" name="error" size="20" />
                <span>{snapshot.error}</span>
                <div class="grow" />
                <IconButton class="text-white" name="clear" onClick={clearError} />
              </div>
            </div>
          </Show>
        </div>
        <RouteList dongleId={props.dongleId} />
      </div>
    </>
  )
}

export default DeviceActivity
