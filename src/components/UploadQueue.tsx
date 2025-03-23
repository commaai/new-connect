import clsx from 'clsx'
import { For, Show, createMemo } from 'solid-js'
import { Transition, TransitionGroup } from 'solid-transition-group'
import type { Component } from 'solid-js'

import { COMMA_CONNECT_PRIORITY } from '~/api/athena'
import Icon from '~/components/material/Icon'
import LinearProgress from '~/components/material/LinearProgress'
import IconButton from '~/components/material/IconButton'
import StatisticBar from '~/components/material/StatisticBar'
import { useUploadQueue } from '~/hooks/use-upload-queue'
import { UploadItem } from '~/types'

interface UploadQueueProps {
  dongleId: string
}

const QueueItem: Component<{ item: UploadItem }> = (props) => {
  const progress = createMemo(() => {
    if (props.item.status === 'waiting_for_network') return 'Waiting for network'
    if (props.item.status === 'queued') return 'Queued'
    if (props.item.progress === 100) return 'Finishing'
    return `${props.item.progress}%`
  })

  const progressColor = createMemo(() => {
    switch (props.item.status) {
      case 'uploading':
        return 'primary'
      case 'queued':
        return 'secondary'
      case 'completed':
        return 'tertiary'
      case 'waiting_for_network':
        return 'secondary'
      default:
        return 'primary'
    }
  })

  return (
    <div class="flex flex-col mb-2 pt-2">
      <div class="flex items-center justify-between flex-wrap mb-1 gap-x-4 min-w-0">
        <div class="flex items-center min-w-0 flex-1">
          <Icon
            class="text-on-surface-variant flex-shrink-0 mr-2"
            name={props.item.priority === COMMA_CONNECT_PRIORITY ? 'face' : 'local_fire_department'}
          />
          <div class="flex min-w-0 gap-1">
            <span class="text-body-sm font-mono truncate text-on-surface">
              {[props.item.route, props.item.segment, props.item.filename].join(' ')}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0 justify-end">
          <span class="text-body-sm font-mono whitespace-nowrap">{progress()}</span>
        </div>
      </div>
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
        <LinearProgress progress={props.item.progress / 100} color={progressColor()} />
      </div>
    </div>
  )
}

const QueueStatistics: Component<{ loading: boolean; items: () => UploadItem[]; class: string }> = (props) => {
  const uploadingCount = createMemo(() => (props.loading ? undefined : props.items().filter((i) => i.status === 'uploading').length))
  const waitingCount = createMemo(() => (props.loading ? undefined : props.items().filter((i) => i.status === 'queued').length))
  const totalCount = createMemo(() => (props.loading ? undefined : props.items().length))

  return (
    <StatisticBar
      class={props.class}
      statistics={[
        { label: 'Uploading', value: uploadingCount() },
        { label: 'Waiting', value: waitingCount() },
        { label: 'Queued', value: totalCount() },
      ]}
    />
  )
}

const QueueList: Component<{ loading: boolean; items: () => UploadItem[]; error?: string; offline?: boolean }> = (props) => {
  return (
    <div class="relative h-[calc(8*2.25rem)]">
      <Transition
        appear
        enterActiveClass="transition-all duration-250 ease-in-out"
        exitActiveClass="transition-all duration-250 ease-in-out"
        enterClass="opacity-0"
        enterToClass="opacity-100"
        exitClass="opacity-100"
        exitToClass="opacity-0"
      >
        <Show
          when={!props.loading}
          fallback={
            <div class="flex justify-center items-center h-full animate-spin absolute inset-0">
              <Icon name="progress_activity" />
            </div>
          }
        >
          <Show
            when={!(props.offline && props.items().length === 0)}
            fallback={
              <div class="flex items-center justify-center h-full gap-2 text-on-surface-variant absolute inset-0">
                <Icon name="signal_disconnected" />
                <span>{props.error}</span>
              </div>
            }
          >
            <Show
              when={props.items().length > 0}
              fallback={
                <div class="flex items-center justify-center h-full gap-2 text-on-surface-variant absolute inset-0">
                  <Icon name="cloud_done" />
                  <span>No files in queue</span>
                </div>
              }
            >
              <div class="absolute inset-0 overflow-y-auto hide-scrollbar">
                <div class="space-y-[-0.75rem]">
                  <TransitionGroup
                    name="list"
                    enterActiveClass="transition-all duration-300 ease-in-out"
                    exitActiveClass="transition-all duration-300 ease-in-out"
                    enterClass="opacity-0 transform translate-x-4"
                    enterToClass="opacity-100 transform translate-x-0"
                    exitClass="opacity-100 transform translate-x-0"
                    exitToClass="opacity-0 transform -translate-x-4"
                    moveClass="transition-transform duration-300"
                  >
                    <For each={props.items()}>
                      {(item) => (
                        <div class="py-1 bg-surface-container-lowest rounded-md px-2">
                          <QueueItem item={item} />
                        </div>
                      )}
                    </For>
                  </TransitionGroup>
                </div>
              </div>
            </Show>
          </Show>
        </Show>
      </Transition>
    </div>
  )
}

const UploadQueue: Component<UploadQueueProps> = (props) => {
  const { loading, error, items, offline, clearQueue, clearingQueue, clearQueueError } = useUploadQueue(props.dongleId)

  return (
    <div class="flex flex-col border-2 border-t-0 border-surface-container-high bg-surface-container-lowest">
      <div class="flex">
        <div class="flex-auto">
          <QueueStatistics loading={loading()} items={items} class="p-4" />
        </div>
        <div class="flex p-4">
          <Show
            when={!clearQueueError()}
            fallback={<IconButton name="error" onClick={() => void clearQueue()} disabled={clearingQueue()} />}
          >
            <IconButton
              class={clsx(clearingQueue() && 'animate-spin')}
              name={clearingQueue() ? 'progress_activity' : 'delete'}
              onClick={() => void clearQueue()}
              disabled={clearingQueue()}
            />
          </Show>
        </div>
      </div>
      <div class="rounded-md border-2 border-surface-container-high mx-4 mb-4 p-4">
        <QueueList loading={loading()} items={items} error={error()} offline={offline()} />
      </div>
    </div>
  )
}

export default UploadQueue
