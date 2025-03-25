import clsx from 'clsx'
import { Show } from 'solid-js'
import type { Component } from 'solid-js'

import IconButton from '~/components/material/IconButton'
import { useUploadQueue } from '~/hooks/use-upload-queue'

import QueueItemTable from './QueueItemTable'
import StatisticBar from '../StatisticBar'

const UploadQueue: Component<{ dongleId: string }> = (props) => {
  const { loading, error, items, offline, clearQueue, clearingQueue, clearQueueError } = useUploadQueue(props.dongleId)

  return (
    <div class="flex flex-col border-2 border-t-0 border-surface-container-high bg-surface-container-lowest">
      <div class="flex">
        <div class="flex-auto">
          <StatisticBar
            statistics={[
              { label: 'Uploading', value: () => items().filter((i) => i.status === 'uploading').length },
              { label: 'Waiting', value: () => items().filter((i) => i.status === 'queued').length },
              { label: 'Total', value: () => items().length },
            ]}
          />
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
