import { createEffect, createResource, createSignal, For, Show, Suspense, type VoidComponent } from 'solid-js'
import { createStore } from 'solid-js/store'
import clsx from 'clsx'
import { takeSnapshot } from '~/api/athena'
import { getAthenaOfflineQueue, getDevice, SHARED_DEVICE } from '~/api/devices'
import { getUploadQueue } from '~/api/file'
import { DrawerToggleButton, useDrawerContext } from '~/components/material/Drawer'
import Icon from '~/components/material/Icon'
import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'
import DeviceLocation from '~/components/DeviceLocation'
import DeviceStatistics from '~/components/DeviceStatistics'
import UploadQueue, { mapOfflineQueueItems } from '~/components/UploadQueue'
import { dayjs } from '~/utils/format'
import { getDeviceName } from '~/utils/device'
import RouteList from '../components/RouteList'
type DeviceActivityProps = {
  dongleId: string
}
const DeviceActivity: VoidComponent<DeviceActivityProps> = (props) => {
  const getOnlineUploadSummary = async (dongleId: string) => {
    try {
      return await getUploadQueue(dongleId)
    } catch {
      return { result: [] }
    }
  }

  const getOfflineUploadSummary = async (dongleId: string) => {
    try {
      return await getAthenaOfflineQueue(dongleId)
    } catch {
      return []
    }
  }
  const [device] = createResource(() => props.dongleId, getDevice)
  const deviceName = () => (device.latest ? getDeviceName(device.latest) : '')
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
  const clearImage = (index: number) =>
    setSnapshot(
      'images',
      snapshot.images.filter((_, i) => i !== index),
    )
  const clearError = () => setSnapshot('error', null)
  const { modal } = useDrawerContext()
  const [onlineQueue] = createResource(() => props.dongleId, getOnlineUploadSummary)
  const [offlineQueue] = createResource(() => props.dongleId, getOfflineUploadSummary)
  const onlineStatus = () => (device.latest?.is_online ? 'Online now' : 'Offline')
  const lastSeen = () =>
    device.latest?.last_athena_ping
      ? `Last seen ${dayjs.unix(device.latest.last_athena_ping).format('MMM D, h:mm A')}`
      : 'Last seen unavailable'
  const versionLabel = () => device.latest?.openpilot_version || 'Version unavailable'
  const uploadSummary = () => {
    const onlineItems = onlineQueue.latest?.result ?? []
    const offlineItems = offlineQueue.latest ? mapOfflineQueueItems(offlineQueue.latest) : []
    const queuedCount = onlineItems.length + offlineItems.length
    if (queuedCount === 0) return { count: 0, label: 'No pending uploads' }
    if (onlineItems.some((item) => item.progress > 0 && item.progress < 1)) {
      return { count: queuedCount, label: `${queuedCount} upload${queuedCount === 1 ? '' : 's'} in progress` }
    }
    if (offlineItems.length > 0 && onlineItems.length === 0) {
      return { count: queuedCount, label: `${queuedCount} queued until the device reconnects` }
    }
    return { count: queuedCount, label: `${queuedCount} upload${queuedCount === 1 ? '' : 's'} queued` }
  }
  createEffect(() => uploadSummary().count > 0 && setQueueVisible(true))
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
              <span class="rounded-full bg-surface-container-high px-2 py-1 text-xs text-on-surface-variant">{uploadSummary().label}</span>
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
