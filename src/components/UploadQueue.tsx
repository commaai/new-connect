import { createSignal, For, Match, onCleanup, Switch, VoidComponent } from 'solid-js'
import { COMMA_CONNECT_PRIORITY, getUploadQueue } from '~/api/athena'
import { UploadFilesToUrlsRequest, UploadQueueItem } from '~/types'
import LinearProgress from './material/LinearProgress'
import Icon from './material/Icon'
import { createStore, reconcile } from 'solid-js/store'
import clsx from 'clsx'
import { getAthenaOfflineQueue } from '~/api/devices'

interface DecoratedUploadQueueItem extends UploadQueueItem {
  route: string
  segment: number
  filename: string
}

const parseUploadPath = (url: string) => {
  const parts = new URL(url).pathname.split('/')
  return { route: parts[3], segment: parseInt(parts[4], 10), filename: parts[5] }
}

const UploadQueueRow: VoidComponent<{ item: DecoratedUploadQueueItem }> = ({ item }) => {
  return (
    <div class="flex flex-col">
      <div class="flex items-center justify-between flex-wrap mb-1 gap-x-4 min-w-0">
        <div class="flex items-center min-w-0 flex-1">
          <Icon
            class="text-on-surface-variant flex-shrink-0 mr-2"
            name={item.priority === COMMA_CONNECT_PRIORITY ? 'person' : 'local_fire_department'}
          />
          <div class="flex min-w-0 gap-1">
            <span class="text-body-sm font-mono truncate text-on-surface">{[item.route, item.segment, item.filename].join(' ')}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0 justify-end">
          <span class="text-body-sm font-mono whitespace-nowrap">{item.id ? `${Math.round(item.progress * 100)}%` : 'Offline'}</span>
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

  const fetch = () => {
    getAthenaOfflineQueue(props.dongleId)
      .then((res) => {
        if (error() === undefined) {
          return
        }
        setItems(
          reconcile(
            res
              .filter((r) => r.method === 'uploadFilesToUrls')
              .flatMap((item) => {
                const params = item.params as UploadFilesToUrlsRequest
                return params.files_data.map((file) => ({
                  ...file,
                  ...parseUploadPath(file.url),
                  path: file.fn,
                  created_at: 0,
                  current: false,
                  id: '',
                  progress: 0,
                  retry_count: 0,
                }))
              }),
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
          reconcile(
            res.result
              ?.map((item) => ({ ...item, ...parseUploadPath(item.url), offline: false }))
              .sort((a, b) => b.progress - a.progress) || [],
          ),
        )
        setError(undefined)
      })
      .catch((error) => {
        if (error instanceof Error && error.cause instanceof Response && error.cause.status === 404) {
          setError(WAITING)
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
    <div class="flex flex-col p-4 gap-4 bg-surface-container-lowest">
      <div class="relative h-[calc(4*3rem)] sm:h-[calc(6*3rem)] flex justify-center items-center text-on-surface-variant">
        <Switch
          fallback={
            <div class="absolute inset-0 flex flex-col gap-2 overflow-y-auto hide-scrollbar">
              <For each={items}>{(item) => <UploadQueueRow item={item} />}</For>
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
