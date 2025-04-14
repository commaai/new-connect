import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

import { dayjs } from '~/utils/format'

const sha = import.meta.env.VITE_APP_GIT_SHA || 'develop'
const timestamp = import.meta.env.VITE_APP_GIT_TIMESTAMP
const formattedTimestamp = timestamp ? dayjs(timestamp).format('YYYY-MM-DD HH:mm') : 'local'
console.debug('BuildInfo', { sha, timestamp, formattedTimestamp })

const BuildInfo: VoidComponent<{ class?: string }> = (props) => {
  return (
    <div class={clsx('text-xs text-on-surface opacity-25 select-text', props.class)}>
      <span class="font-mono cursor-text select-all selection:bg-primary-container">{sha.substring(0, 7)}</span>
      <span class="mx-1">•</span>
      <span>{formattedTimestamp}</span>
    </div>
  )
}

export default BuildInfo
