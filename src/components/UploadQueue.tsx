import { createQuery } from '@tanstack/solid-query'
import { createEffect, For, Show, Suspense, VoidComponent } from 'solid-js'
import { cancelUpload, getUploadQueue } from '~/api/athena'
import { UploadFilesToUrlsRequest, UploadQueueItem } from '~/types'
import LinearProgress from './material/LinearProgress'
import Icon, { IconName } from './material/Icon'
import { getAthenaOfflineQueue } from '~/api/devices'
import IconButton from './material/IconButton'
import StatisticBar from './StatisticBar'
import { createStore, reconcile } from 'solid-js/store'
import clsx from 'clsx'

interface DecoratedUploadQueueItem extends UploadQueueItem {
  route: string
  segment: number
  filename: string
  isFirehose: boolean
}

const parseUploadPath = (url: string) => {
  const parsed = new URL(url)
  const parts = parsed.pathname.split('/')
  if (parsed.hostname === 'upload.commadotai.com') {
    return { route: parts[2], segment: parseInt(parts[3], 10), filename: parts[4], isFirehose: true }
  }
  return { route: parts[3], segment: parseInt(parts[4], 10), filename: parts[5], isFirehose: false }
}

const cancel = (dongleId: string, ids: string[]) => {
  if (ids.length === 0) return
  cancelUpload(dongleId, ids).catch((error) => {
    console.error('Error canceling uploads', error)
  })
}

const UploadQueueRow: VoidComponent<{ dongleId: string; item: DecoratedUploadQueueItem }> = ({ dongleId, item }) => {
  return (
    <div class="flex flex-col">
      <div class="flex items-center justify-between flex-wrap mb-1 gap-x-4 min-w-0">
        <div class="flex items-center min-w-0 flex-1">
          <Icon class="text-on-surface-variant flex-shrink-0 mr-2" name={item.isFirehose ? 'local_fire_department' : 'person'} />
          <div class="flex min-w-0 gap-1">
            <span class="text-body-sm font-mono truncate text-on-surface">{[item.route, item.segment, item.filename].join(' ')}</span>
          </div>
        </div>
        <div class="flex items-center gap-0.5 flex-shrink-0 justify-end">
          <Show
            when={!item.id || item.progress !== 0}
            fallback={<IconButton class="text-red-300" size="20" name="close_small" onClick={() => cancel(dongleId, [item.id])} />}
          >
            <span class="text-body-sm font-mono whitespace-nowrap pr-[0.5rem]">
              {item.id ? `${Math.round(item.progress * 100)}%` : 'Offline'}
            </span>
          </Show>
        </div>
      </div>
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
        <LinearProgress progress={item.progress} color={Math.round(item.progress * 100) === 100 ? 'tertiary' : 'primary'} />
      </div>
    </div>
  )
}

const UploadQueue: VoidComponent<{ dongleId: string }> = (props) => {
  const dongleId = () => props.dongleId
  const onlineQueue = createQuery(() => ({
    queryKey: ['online_queue', dongleId()],
    queryFn: () => getUploadQueue(dongleId()),
    select: (data) => data.result?.map((item) => ({ ...item, ...parseUploadPath(item.url) })).sort((a, b) => b.progress - a.progress) || [],
    retry: false,
    refetchInterval: 1000,
  }))

  const offlineQueue = createQuery(() => ({
    queryKey: ['offline_queue', dongleId()],
    queryFn: () => getAthenaOfflineQueue(dongleId()),
    enabled: onlineQueue.status !== 'success',
    select: (data) =>
      data
        ?.filter((item) => item.method === 'uploadFilesToUrls')
        .flatMap((item) =>
          (item.params as UploadFilesToUrlsRequest).files_data.map((file) => ({
            ...file,
            ...parseUploadPath(file.url),
            path: file.fn,
            created_at: 0,
            current: false,
            id: '',
            progress: 0,
            retry_count: 0,
          })),
        ) || [],
    retry: false,
    refetchInterval: 5000,
  }))

  const [itemStore, setItemStore] = createStore<DecoratedUploadQueueItem[]>([])
  createEffect(() => {
    // only check data (triggering suspense boundary) if haven't fetched yet
    const online = !onlineQueue.isFetched || onlineQueue.status === 'success' ? (onlineQueue.data ?? []) : []
    const offline = offlineQueue.data ?? []

    setItemStore(reconcile([...online, ...offline]))
  })

  const cancelAll = () =>
    cancel(
      dongleId(),
      itemStore.map((item) => item.id),
    )

  const StatusMessage = (props: { iconClass?: string; icon: IconName; message: string }) => (
    <div class="flex items-center gap-2">
      <Icon name={props.icon} class={clsx('mr-2', props.iconClass)} />
      <div>{props.message}</div>
    </div>
  )

  return (
    <div class="flex flex-col gap-4 bg-surface-container-lowest">
      <div class="flex p-4 justify-between items-center border-b-2 border-b-surface-container-low">
        <StatisticBar statistics={[{ label: 'Queued', value: () => itemStore.length }]} />
        <IconButton name="close" onClick={cancelAll} />
      </div>
      <div class="relative h-[calc(4*3rem)] sm:h-[calc(6*3rem)] flex justify-center items-center text-on-surface-variant">
        <Suspense fallback={<StatusMessage iconClass="animate-spin" icon="autorenew" message="Waiting for device to connect..." />}>
          <Show
            when={itemStore.length > 0}
            fallback={
              <StatusMessage
                icon={onlineQueue.isFetched && !onlineQueue.isSuccess ? 'error' : 'check'}
                message={onlineQueue.isFetched && !onlineQueue.isSuccess ? 'Device offline' : 'Nothing to upload'}
              />
            }
          >
            <div class="absolute inset-0 bottom-4 flex flex-col gap-2 px-4 overflow-y-auto hide-scrollbar">
              <For each={itemStore}>{(item) => <UploadQueueRow dongleId={dongleId()} item={item} />}</For>
            </div>
          </Show>
        </Suspense>
      </div>
    </div>
  )
}

export default UploadQueue
