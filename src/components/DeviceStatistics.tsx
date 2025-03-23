import { createResource } from 'solid-js'
import type { VoidComponent } from 'solid-js'

import { getDeviceStats } from '~/api/devices'
import StatisticBar from '~/components/material/StatisticBar'
import { formatDistance, formatDuration } from '~/utils/format'
<<<<<<< HEAD
import StatisticBar from './StatisticBar'
=======
>>>>>>> 1079a68 (cleanup)

const DeviceStatistics: VoidComponent<{ class?: string; dongleId: string }> = (props) => {
  const [statistics] = createResource(() => props.dongleId, getDeviceStats)
  const allTime = () => statistics()?.all

  return (
    <StatisticBar
      class={props.class}
      statistics={[
        { label: 'Distance', value: () => formatDistance(allTime()?.distance) },
        { label: 'Duration', value: () => formatDuration(allTime()?.minutes) },
        { label: 'Routes', value: () => allTime()?.routes },
      ]}
    />
  )
}

export default DeviceStatistics
