import clsx from 'clsx'
import { Show } from 'solid-js'
import type { Component } from 'solid-js'

import IconButton from '~/components/material/IconButton'
import { useUploadQueue } from '~/hooks/use-upload-queue'

import QueueStatistics from './QueueStatistics'
import QueueItemTable from './QueueItemTable'

interface UploadQueueProps {
  dongleId: string
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
        <QueueItemTable loading={loading()} items={items} error={error()} offline={offline()} />
      </div>
    </div>
  )
}

export default UploadQueue
