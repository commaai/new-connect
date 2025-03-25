import clsx from 'clsx'
import { createResource, Suspense } from 'solid-js'
import type { Component } from 'solid-js'

import IconButton from '~/components/material/IconButton'
import { useUploadQueue } from '~/hooks/use-upload-queue'

import QueueItemTable from './QueueItemTable'
import StatisticBar from '../StatisticBar'

const UploadQueue: Component<{ dongleId: string }> = (props) => {
  const [queue] = createResource(() => props.dongleId, useUploadQueue)
  const items = () => queue()?.items()
  const clearingQueue = () => queue()?.clearingQueue()
  const clearQueueError = () => queue()?.clearQueueError()
  const clearQueue = () => void queue()?.clearQueue()

  return (
    <div class="flex flex-col border-2 border-t-0 border-surface-container-high bg-surface-container-lowest">
      <div class="flex">
        <div class="flex-auto p-4">
          <StatisticBar
            statistics={[
              {
                label: 'Uploading',
                value: () => items()?.filter((i) => i.status === 'uploading').length,
              },
              {
                label: 'Waiting',
                value: () => items()?.filter((i) => i.status === 'queued').length,
              },
              { label: 'Total', value: () => items()?.length },
            ]}
          />
        </div>
        <div class="flex p-4">
          <Suspense fallback={<IconButton name="delete" />}>
            <IconButton
              class={clsx(clearingQueue() && 'animate-spin')}
              name={clearingQueue() ? 'progress_activity' : clearQueueError() ? 'error' : 'delete'}
              onClick={() => void clearQueue()}
              disabled={clearingQueue()}
            />
          </Suspense>
        </div>
      </div>
      <div class="rounded-md border-2 border-surface-container-high mx-4 mb-4 p-4">
        <QueueItemTable items={items} error={clearQueueError} offline={queue()?.offline()} />
      </div>
    </div>
  )
}

export default UploadQueue
