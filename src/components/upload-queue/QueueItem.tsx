import { Component, createMemo } from 'solid-js'

import { COMMA_CONNECT_PRIORITY } from '~/api/athena'
import Icon from '~/components/material/Icon'
import LinearProgress from '~/components/material/LinearProgress'
import { UploadItem } from '~/types'

const QueueItem: Component<{ item: UploadItem }> = (props) => {
  const progress = createMemo(() => {
    if (props.item.status === 'waiting_for_network') return 'Waiting for network'
    if (props.item.status === 'queued') return 'Queued'
    if (props.item.progress === 100) return 'Finishing'
    return `${props.item.progress}%`
  })

  const progressColor = createMemo(() => {
    switch (props.item.status) {
      case 'completed':
        return 'tertiary'
      case 'queued':
        return 'secondary'
      case 'waiting_for_network':
        return 'secondary'
      default:
        return 'primary'
    }
  })

  const icon = createMemo(() => (props.item.priority === COMMA_CONNECT_PRIORITY ? 'face' : 'local_fire_department'))

  return (
    <div class="flex flex-col">
      <div class="flex items-center justify-between flex-wrap mb-1 gap-x-4 min-w-0">
        <div class="flex items-center min-w-0 flex-1">
          <Icon class="text-on-surface-variant flex-shrink-0 mr-2" name={icon()} />
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

export default QueueItem
