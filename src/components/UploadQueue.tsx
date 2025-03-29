import { createSignal, For, Match, onCleanup, Show, Switch, VoidComponent } from 'solid-js'
import { cancelUpload, getUploadQueue } from '~/api/athena'
import { UploadFilesToUrlsRequest, UploadQueueItem } from '~/types'
import LinearProgress from './material/LinearProgress'
import Icon from './material/Icon'
import { createStore, reconcile } from 'solid-js/store'
import clsx from 'clsx'
import { getAthenaOfflineQueue } from '~/api/devices'
import IconButton from './material/IconButton'
import StatisticBar from './StatisticBar'

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
  return { route: parts[3], segment: parseInt(parts[4], 10), filename: parts[5], isFirehouse: false }
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

const WAITING = 'Waiting for device to connect...'

const UploadQueue: VoidComponent<{ dongleId: string }> = (props) => {
  const [error, setError] = createSignal<string | undefined>(WAITING)
  const [items, setItems] = createStore<DecoratedUploadQueueItem[]>([])

  let timeout: Timer | undefined

  const cancelAll = () =>
    cancel(
      props.dongleId,
      items.map((item) => item.id),
    )
  const fetch = () => {
    getAthenaOfflineQueue(props.dongleId)
      .then((res) => {
        if (!error()) return
        setItems(
          reconcile(
            res
              ?.filter((r) => r.method === 'uploadFilesToUrls')
              .flatMap((item) => {
                return (item.params as UploadFilesToUrlsRequest).files_data.map((file) => ({
                  ...file,
                  ...parseUploadPath(file.url),
                  path: file.fn,
                  created_at: 0,
                  current: false,
                  id: '',
                  progress: 0,
                  retry_count: 0,
                }))
              }) || [],
          ),
        )
      })
      .catch((error) => {
        console.error('Error fetching offline queue', error)
      })
    getUploadQueue(props.dongleId)
      .then((res) => {
        if (res.error) {
          setError(res.error)
          return
        }
        setItems(
          reconcile(res.result?.map((item) => ({ ...item, ...parseUploadPath(item.url) })).sort((a, b) => b.progress - a.progress) || []),
        )
        setError(undefined)
      })
      .catch((error) => {
        if (error instanceof Error && error.cause instanceof Response && error.cause.status === 404) {
          setError('Device is offline')
          return
        }
        setError(error.toString())
      })
      .finally(() => {
        if (!timeout) return
        timeout = setTimeout(fetch, 1000)
      })
  }

  timeout = setTimeout(fetch, 0)

  onCleanup(() => {
    clearTimeout(timeout)
    timeout = undefined
  })

  return (
    <div class="flex flex-col gap-4 bg-surface-container-lowest">
      <div class="flex p-4 justify-between items-center border-b-2 border-b-surface-container-low">
        <StatisticBar statistics={[{ label: 'Queued', value: () => items.length }]} />
        <IconButton name="close" onClick={cancelAll} />
      </div>
      <div class="relative h-[calc(4*3rem)] sm:h-[calc(6*3rem)] flex justify-center items-center text-on-surface-variant">
        <Switch
          fallback={
            <div class="absolute inset-0 bottom-4 flex flex-col gap-2 px-4 overflow-y-auto hide-scrollbar">
              <For each={items}>{(item) => <UploadQueueRow dongleId={props.dongleId} item={item} />}</For>
            </div>
          }
        >
          <Match when={error() && items.length === 0}>
            <Icon class={clsx(error() === WAITING && 'animate-spin')} name={error() === WAITING ? 'progress_activity' : 'error'} />
            <span class="ml-2">{error()}</span>
          </Match>
          <Match when={items.length === 0}>
            <Icon name="check" />
            <span class="ml-2">Nothing to upload</span>
          </Match>
        </Switch>
      </div>
    </div>
  )
}

export default UploadQueue
