import { createResource } from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

import { getDeviceStats } from '~/api/devices'
import { formatDistance, formatDuration } from '~/utils/date'

import Typography from '~/components/material/Typography'

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
        <Typography variant="body-sm" color="on-surface-variant">
          Distance
        </Typography>
        <Typography variant="label-lg">
          {formatDistance(allTime()?.distance)}
        </Typography>
      </div>

      <div class="flex flex-col justify-between">
        <Typography variant="body-sm" color="on-surface-variant">
          Duration
        </Typography>
        <Typography variant="label-lg">
          {formatDuration(allTime()?.minutes)}
        </Typography>
      </div>

      <div class="flex flex-col justify-between">
        <Typography variant="body-sm" color="on-surface-variant">
          Routes
        </Typography>
        <Typography variant="label-lg">{allTime()?.routes ?? 0}</Typography>
      </div>
    </div>
  )
}

export default DeviceStatistics
