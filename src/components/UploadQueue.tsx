import { createSignal, For, Match, onCleanup, Switch, VoidComponent } from 'solid-js'
import { COMMA_CONNECT_PRIORITY, getUploadQueue } from '~/api/athena'
import { UploadQueueItem } from '~/types'
import LinearProgress from './material/LinearProgress'
import Icon from './material/Icon'
import { createStore, reconcile } from 'solid-js/store'

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
          <span class="text-body-sm font-mono whitespace-nowrap">{Math.round(item.progress * 100)}%</span>
        </div>
      </div>
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
        <LinearProgress progress={item.progress} color="primary" />
      </div>
    </div>
  )
}

const UploadQueue: VoidComponent<{ dongleId: string }> = (props) => {
  const [error, setError] = createSignal<string | undefined>()
  const [items, setItems] = createStore<DecoratedUploadQueueItem[]>([])
  const [loading, setLoading] = createSignal(true)

  let timeout: Timer | undefined

  const fetch = () => {
    getUploadQueue(props.dongleId)
      .then((res) => {
        if (res.error) {
          setError(res.error)
          return
        }
        setItems(
          reconcile(res.result?.map((item) => ({ ...item, ...parseUploadPath(item.url) })).sort((a, b) => b.progress - a.progress) || []),
        )
      })
      .catch((error) => {
        if (error instanceof Error && error.cause instanceof Response && error.cause.status === 404) {
          setError('Device offline')
          return
        }
        setError(error.toString())
      })
      .finally(() => {
        if (!timeout) return
        setLoading(false)
        timeout = setTimeout(fetch, 1000)
      })
  }

  timeout = setTimeout(fetch, 0)

  onCleanup(() => {
    clearTimeout(timeout)
    timeout = undefined
  })

  return (
    <div class="flex flex-col border-2 border-t-0 border-surface-container-high bg-surface-container-lowest">
      <div class="flex flex-col flex-auto p-4 gap-4">
        <div class="relative h-[calc(4*3rem)] sm:h-[calc(6*3rem)] flex justify-center items-center text-on-surface-variant">
          <Switch>
            <Match when={loading()}>
              <Icon name="progress_activity" class="animate-spin" />
            </Match>
            <Match when={error()}>
              <Icon name="error" />
              <span class="ml-2">{error()}</span>
            </Match>
            <Match when={items.length === 0}>
              <Icon name="check" />
              <span class="ml-2">Nothing to upload</span>
            </Match>
            <Match when={true}>
              <div class="absolute inset-0 flex flex-col gap-2 overflow-y-auto hide-scrollbar">
                <For each={items}>{(item) => <UploadQueueRow item={item} />}</For>
              </div>
            </Match>
          </Switch>
        </div>
      </div>
    </div>
  )
}

export default UploadQueue
