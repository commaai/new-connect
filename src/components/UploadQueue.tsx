import { For, Show, createMemo } from 'solid-js'
import { Transition, TransitionGroup } from 'solid-transition-group'
import type { Component } from 'solid-js'

import Icon from '~/components/material/Icon'
import LinearProgress from '~/components/material/LinearProgress'
import IconButton from '~/components/material/IconButton'
import StatisticBar from '~/components/material/StatisticBar'
import { useUploadQueue } from '~/hooks/use-upload-queue'
import { UploadItem } from '~/types'

interface UploadQueueProps {
  dongleId: string
}

const parseUploadPath = (url: string) => {
  const parts = new URL(url).pathname.split('/')
  const route = parts[3]
  const segment = parts[4]
  const filename = parts[5]

  return { route, segment, filename }
}

const getStatusPriority = (status: UploadItem['status']): number => {
  switch (status) {
    case 'pending': return 2
    case 'waiting_for_network': return 2
    default: return 1
  }
}

const QueueItem: Component<{ item: UploadItem }> = (props) => {
  const progress = createMemo(() => {
    if (props.item.status === 'waiting_for_network') return 'Waiting for network'
    if (props.item.status === 'pending') return 'Queued'

    const progress = Math.round(props.item.progress * 100)
    if (progress === 100) return 'Finishing'
    return `${progress}%`
  })

  const pathInfo = createMemo(() => {
    return parseUploadPath(props.item.uploadUrl)
  })

  const progressColor = createMemo(() => {
    switch (props.item.status) {
      case 'uploading': return 'primary'
      case 'pending': return 'secondary'
      case 'completed': return 'tertiary'
      case 'waiting_for_network': return 'secondary'
      default: return 'primary'
    }
  })

  return (
    <div class="flex flex-col mb-2 pt-2">
      <div class="flex items-center justify-between flex-wrap mb-1 gap-x-4 min-w-0">
        <div class="flex items-center min-w-0 flex-1">
          <Icon class="text-on-surface-variant flex-shrink-0 mr-2">
            {props.item.priority === 0 ? 'face' : 'local_fire_department'}
          </Icon>
          <Show when={pathInfo().route} fallback={
            <span class="text-body-sm font-mono truncate text-on-surface">{props.item.name}</span>
          }>
            <div class="flex min-w-0 gap-1">
              <span class="text-body-sm font-mono truncate text-on-surface">{[pathInfo().route, pathInfo().segment, pathInfo().filename].join(' ')}</span>
            </div>
          </Show>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0 justify-end">
          <span class="text-body-sm font-mono whitespace-nowrap">{progress()}</span>
        </div>
      </div>
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
        <LinearProgress progress={props.item.progress} color={progressColor()} />
      </div>
    </div>
  )
}

const QueueStatistics: Component<{ loading: boolean; items: UploadItem[]; class: string }> = (props) => {
  const uploadingCount = createMemo(() => props.loading ? undefined : props.items.filter(i => i.status === 'uploading').length)
  const waitingCount = createMemo(() => props.loading ? undefined : props.items.filter(i => i.status === 'pending').length)
  const queuedCount = createMemo(() => props.loading ? undefined : props.items.length)

  return (
    <StatisticBar
      class={props.class}
      statistics={[
        { label: "Uploading", value: uploadingCount() },
        { label: "Waiting", value: waitingCount() },
        { label: "Queued", value: queuedCount() },
      ]}
    />
  );
}

const QueueList: Component<{ loading: boolean; items: UploadItem[]; error?: string; offline?: boolean }> = (props) => {
  const sortedItems = createMemo(() => {
    return [...props.items].sort((a, b) => {
      // First sort by status priority
      const statusDiff = getStatusPriority(a.status) - getStatusPriority(b.status)
      if (statusDiff !== 0) return statusDiff
      
      // Then sort by ID for stability within same status
      return a.id.localeCompare(b.id)
    })
  })

  return (
    <div class="relative h-[calc(8*2.25rem)]">
      <Transition
        enterActiveClass="transition-all duration-300 ease-in-out"
        exitActiveClass="transition-all duration-300 ease-in-out"
        enterClass="opacity-0"
        enterToClass="opacity-100"
        exitClass="opacity-100"
        exitToClass="opacity-0"
        appear={true}
      >
        <Show
          when={!props.loading}
          fallback={
            <div class="flex justify-center items-center h-full animate-spin absolute inset-0">
              <Icon>progress_activity</Icon>
            </div>
          }
        >
          <Show
            when={!(props.offline && props.items.length === 0)}
            fallback={
              <div class="flex items-center justify-center h-full gap-2 text-on-surface-variant absolute inset-0">
                <Icon>signal_disconnected</Icon>
                <span>{props.error}</span>
              </div>
            }
          >
            <Show
              when={props.items.length > 0}
              fallback={
                <div class="flex items-center justify-center h-full gap-2 text-on-surface-variant absolute inset-0">
                  <Icon>cloud_done</Icon>
                  <span>No files in queue</span>
                </div>
              }
            >
              <div class="absolute inset-0 overflow-y-auto hide-scrollbar">
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
                  <div class="space-y-[-0.75rem]">
                    <For each={sortedItems()}>
                      {(item) => (
                        <div class="py-1 bg-surface-container-lowest rounded-md px-2" data-id={item.id}>
                          <QueueItem item={item} />
                        </div>
                      )}
                    </For>
                  </div>
                </TransitionGroup>
              </div>
            </Show>
          </Show>
        </Show>
      </Transition>
    </div>
  );
}

const UploadQueue: Component<UploadQueueProps> = (props) => {
  const { loading, error, items, offline, clearQueue } = useUploadQueue(props.dongleId)

  return (
    <div class="flex flex-col border-2 border-t-0 border-surface-container-high bg-surface-container-lowest">
      <div class="flex">
        <div class="flex-auto">
            <QueueStatistics loading={loading()} items={items()} class="p-4" />
        </div>
        <div class="flex p-4">
          <IconButton onClick={() => void clearQueue()}>delete</IconButton>
        </div>
      </div>
      <div class="rounded-md border-2 border-surface-container-high mx-4 mb-4 p-4">
        <QueueList
          loading={loading()}
          items={items()}
          error={error()}
          offline={offline()}
        />
      </div>
    </div>
  );
}

export default UploadQueue