import clsx from 'clsx'
import { createMemo } from 'solid-js'
import type { Component } from 'solid-js'

import { UploadItem } from '~/types'

const QueueStatistics: Component<{ loading: boolean; items: () => UploadItem[]; class: string }> = (props) => {
  const uploadingCount = createMemo(() => (props.loading ? undefined : props.items().filter((i) => i.status === 'uploading').length))
  const waitingCount = createMemo(() => (props.loading ? undefined : props.items().filter((i) => i.status === 'queued').length))
  const totalCount = createMemo(() => (props.loading ? undefined : props.items().length))

  return (
    <div class={clsx('flex h-10 w-full', props.class)}>
      <div class="flex grow flex-col justify-between">
        <span class="text-body-sm text-on-surface-variant">Uploading</span>
        <span class="font-mono text-label-lg uppercase">{uploadingCount()}</span>
      </div>

      <div class="flex grow flex-col justify-between">
        <span class="text-body-sm text-on-surface-variant">Waiting</span>
        <span class="font-mono text-label-lg uppercase">{waitingCount()}</span>
      </div>

      <div class="flex grow flex-col justify-between">
        <span class="text-body-sm text-on-surface-variant">Queued</span>
        <span class="font-mono text-label-lg uppercase">{totalCount()}</span>
      </div>
    </div>
  )
}

export default QueueStatistics
