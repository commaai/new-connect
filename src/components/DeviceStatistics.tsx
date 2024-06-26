import { createResource } from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'
import { getDeviceStats } from '~/api/devices'
import { formatDistance, formatDuration } from '~/utils/date'
import { Device } from '~/types'
import Icon from './material/Icon'

type DeviceStatisticsProps = {
  class?: string
  device: Device | undefined
}

const DeviceStatistics: VoidComponent<DeviceStatisticsProps> = (props) => {
  const [statistics] = createResource(() => props.device?.dongle_id, getDeviceStats)
  const allTime = () => statistics()?.all

  type StatProps = {
    icon: string
    data: string
    label: string
  }
  const Stat: VoidComponent<StatProps> = (props) => {
    return <div class="flex basis-1/3 flex-col items-center justify-center">
      <div class="flex">
        <Icon class="text-on-secondary-container">{`${props.icon}`}</Icon>
        <h1>{props.data}</h1>
      </div>
      <p class="text-sm text-on-secondary-container">{props.label}</p>
    </div>
  }

  return (
    <div class={clsx('flex items-center justify-center p-4', props.class)}>
      <Stat icon="distance" label="driven" data={`${Math.round(formatDistance(allTime()?.distance))} mi`} />
      <Stat icon="timer" label="duration" data={formatDuration(allTime()?.minutes)} />
      <Stat icon="map" label="routes" data={`${allTime()?.routes ?? 0}`} />
    </div>
  )
}

export default DeviceStatistics
