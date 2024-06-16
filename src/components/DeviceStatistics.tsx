import { createResource } from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

import { getDeviceStats } from '~/api/devices'
import { formatDistance, formatDuration } from '~/utils/date'

type DeviceStatisticsProps = {
  class?: string
  dongleId: string
}

const DeviceStatistics: VoidComponent<DeviceStatisticsProps> = (props) => {
  const [statistics] = createResource(() => props.dongleId, getDeviceStats)
  const allTime = () => statistics()?.all

  return (
    <div class={clsx('flex h-10 w-full gap-8', props.class)}>
      <div class="flex flex-col justify-between">
        <span class="text-body-sm text-on-surface-variant">Distance</span>
        <span class="text-label-lg font-mono uppercase">{formatDistance(allTime()?.distance)}</span>
      </div>

      <div class="flex flex-col justify-between">
        <span class="text-body-sm text-on-surface-variant">Duration</span>
        <span class="text-label-lg font-mono uppercase">{formatDuration(allTime()?.minutes)}</span>
      </div>

      <div class="flex flex-col justify-between">
        <span class="text-body-sm text-on-surface-variant">Routes</span>
        <span class="text-label-lg font-mono uppercase">{allTime()?.routes ?? 0}</span>
      </div>
    </div>
  )
}

export default DeviceStatistics
