import { createResource } from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

import { getDeviceStats } from '~/api/devices'
import { formatDistance, formatDuration } from '~/utils/format'

type DeviceStatisticsProps = {
  class?: string
  dongleId: string
}

const DeviceStatistics: VoidComponent<DeviceStatisticsProps> = (props) => {
  const [statistics] = createResource(() => props.dongleId, getDeviceStats)
  const allTime = () => statistics()?.all

  return (
    <div class={clsx('flex h-10 w-full', props.class)}>
      <div class="flex grow flex-col justify-between">
        <span class="text-body-sm text-on-surface-variant">Distance</span>
        <span class="font-mono text-label-lg uppercase">{formatDistance(allTime()?.distance)}</span>
      </div>

      <div class="flex grow flex-col justify-between">
        <span class="text-body-sm text-on-surface-variant">Duration</span>
        <span class="font-mono text-label-lg uppercase">{formatDuration(allTime()?.minutes)}</span>
      </div>

      <div class="flex grow flex-col justify-between">
        <span class="text-body-sm text-on-surface-variant">Routes</span>
        <span class="font-mono text-label-lg uppercase">{allTime()?.routes ?? 0}</span>
      </div>
    </div>
  )
}

export default DeviceStatistics
