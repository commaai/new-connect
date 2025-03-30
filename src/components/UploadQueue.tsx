import { createMutation, createQuery, useQueryClient } from '@tanstack/solid-query'
import { createEffect, For, Match, Show, Switch, VoidComponent } from 'solid-js'
import { cancelUpload, getUploadQueue } from '~/api/athena'
import { UploadFilesToUrlsRequest, UploadQueueItem } from '~/types'
import LinearProgress from './material/LinearProgress'
import Icon, { IconName } from './material/Icon'
import { getAthenaOfflineQueue } from '~/api/devices'
import IconButton from './material/IconButton'
import StatisticBar from './StatisticBar'
import Button from '~/components/material/Button'
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

const UploadQueueRow: VoidComponent<{ cancel: (id: string) => void; item: DecoratedUploadQueueItem }> = ({ cancel, item }) => {
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
            fallback={<IconButton size="20" name="close_small" onClick={() => cancel(item.id)} />}
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

const StatusMessage: VoidComponent<{ iconClass?: string; icon: IconName; message: string }> = (props) => (
  <div class="flex items-center gap-2">
    <Icon name={props.icon} class={clsx(props.iconClass)} />
    <div>{props.message}</div>
  </div>
)

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
    enabled: !onlineQueue.isSuccess,
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
    refetchInterval: 1000,
  }))

  const queryClient = useQueryClient()
  const cancelMutation = createMutation(() => ({
    mutationFn: (ids: string[]) => cancelUpload(dongleId(), ids),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['online_queue', dongleId()] }),
  }))

  const [itemStore, setItemStore] = createStore<DecoratedUploadQueueItem[]>([])
  createEffect(() => {
    const online = onlineQueue.isSuccess ? (onlineQueue.data ?? []) : []
    const offline = offlineQueue.isSuccess ? (offlineQueue.data ?? []) : []
    setItemStore(reconcile([...online, ...offline]))
  })

  const cancelOne = (id: string) => cancelMutation.mutate([id])
  const cancelAll = () => {
    const ids = itemStore.filter((item) => item.id).map((item) => item.id)
    if (ids.length === 0) return
    cancelMutation.mutate(ids)
  }

  return (
    <div class="flex flex-col gap-4 bg-surface-container-lowest">
      <div class="flex p-4 justify-between items-center border-b-2 border-b-surface-container-low">
        <StatisticBar statistics={[{ label: "Queued", value: () => itemStore.length }]} />
        <Button
          onClick={() =>
            cancel(
              dongleId(),
              itemStore.filter((item) => item.id).map((item) => item.id)
            )
          }
          class="px-2 md:px-3"
          leading={<Icon name="close" size="20" />}
          color="primary"
        >
          <span class="flex items-center gap-1 font-mono">Cancel All</span>
        </Button>
      </div>
      <div class="relative h-[calc(4*3rem)] sm:h-[calc(6*3rem)] flex justify-center items-center text-on-surface-variant">
        <Switch
          fallback={
            <div class="absolute inset-0 bottom-4 flex flex-col gap-2 px-4 overflow-y-auto hide-scrollbar">
              <For each={itemStore}>{(item) => <UploadQueueRow cancel={cancelOne} item={item} />}</For>
            </div>
          }
        >
          <Match when={!onlineQueue.isFetched}>
            <StatusMessage iconClass="animate-spin" icon="autorenew" message="Waiting for device to connect..." />
          </Match>
          <Match when={onlineQueue.isFetched && !onlineQueue.isSuccess && itemStore.length === 0}>
            <StatusMessage icon="error" message="Device offline" />
          </Match>
          <Match when={onlineQueue.isFetched && onlineQueue.isSuccess && itemStore.length === 0}>
            <StatusMessage icon="check" message="Nothing to upload" />
          </Match>
        </Switch>
      </div>
    </div>
  );
}

export default UploadQueue
