import clsx from 'clsx'
import { createResource, Show } from 'solid-js'
import type { Component } from 'solid-js'

import IconButton from '~/components/material/IconButton'
import { useUploadQueue } from '~/hooks/use-upload-queue'

import QueueItemTable from './QueueItemTable'
import StatisticBar from '../StatisticBar'

const UploadQueue: Component<{ dongleId: string }> = (props) => {
  const [queue] = createResource(() => props.dongleId, useUploadQueue)

  return (
    <div class="flex flex-col border-2 border-t-0 border-surface-container-high bg-surface-container-lowest">
      <div class="flex">
        <div class="flex-auto p-4">
          <StatisticBar
            statistics={[
              {
                label: 'Uploading',
                value: () =>
                  queue()
                    ?.items()
                    .filter((i) => i.status === 'uploading').length,
              },
              {
                label: 'Waiting',
                value: () =>
                  queue()
                    ?.items()
                    .filter((i) => i.status === 'queued').length,
              },
              { label: 'Total', value: () => queue()?.items().length },
            ]}
          />
        </div>
        <div class="flex p-4">
          <Show
            when={!queue()?.clearQueueError()}
            fallback={<IconButton name="error" onClick={() => void queue()?.clearQueue()} disabled={queue()?.clearingQueue()} />}
          >
            <IconButton
              class={clsx(queue()?.clearingQueue() && 'animate-spin')}
              name={queue()?.clearingQueue() ? 'progress_activity' : 'delete'}
              onClick={() => void queue()?.clearQueue()}
              disabled={queue()?.clearingQueue()}
            />
          </Show>
        </div>
      </div>
      <div class="rounded-md border-2 border-surface-container-high mx-4 mb-4 p-4">
        <QueueItemTable
          loading={queue()?.loading?.() ?? true}
          items={queue()?.items}
          error={queue()?.error()}
          offline={queue()?.offline()}
        />
      </div>
    </div>
  )
}

export default UploadQueue
