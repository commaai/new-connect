import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

import type { Route } from '~/types'
import { formatRouteDuration } from '~/utils/date'
import Icon from './material/Icon'

type RouteStatisticsProps = {
  class?: string
  route?: Route
}

export const RouteCardStatistics: VoidComponent<RouteStatisticsProps> = (props) => {
  return (
    <div class={clsx('flex w-full items-stretch gap-4', props.class)}>
      <div class="flex flex-col">
        <span class="text-body-sm text-on-surface-variant">Distance</span>
        <span class="font-mono text-label-lg uppercase">{props.route?.ui_derived?.distance}mi</span>
      </div>

      <div class="flex flex-col">
        <span class="text-body-sm text-on-surface-variant">Duration</span>
        <span class="font-mono text-label-lg uppercase">{formatRouteDuration(props.route?.ui_derived?.duration)}</span>
      </div>

      <div class="flex flex-col">
        <span class="text-body-sm text-on-surface-variant">Engaged</span>
        <span class="font-mono text-label-lg uppercase">{`${props.route?.ui_derived?.engagement}%`}</span>
      </div>

      <div class="flex flex-col">
        <span class="text-body-sm text-on-surface-variant">User flags</span>
        <span class="font-mono text-label-lg uppercase">{props.route?.ui_derived?.flags}</span>
      </div>
    </div>
  )
}

export const DriveStatistics: VoidComponent<RouteStatisticsProps> = (props) => {

  type Props = {
    icon: string
    data: string | number | undefined
    label: string
  }
  const Statistic: VoidComponent<Props> = (statisticProps) => {
    return <div class="flex size-full flex-col">
      <div class="flex basis-3/4 items-end justify-center space-x-2">
        <Icon class="text-on-secondary-container">{statisticProps.icon}</Icon>
        <h1>{statisticProps?.data}</h1>
      </div>
      <div class="flex basis-1/4 items-center justify-center">
        <p class="text-sm text-on-secondary-container">{statisticProps.label}</p>
      </div>
    </div>
  }

  return <div class="grid size-full h-1/2 grid-cols-2 grid-rows-2 rounded-md">
    <Statistic icon="map" label="Distance" data={`${props.route?.ui_derived?.distance}mi`} />
    <Statistic icon="timer" label="Duration" data={formatRouteDuration(props.route?.ui_derived?.duration)} />
    <Statistic icon="search_hands_free" label="Engagement" data={`${props.route?.ui_derived?.engagement}%`} />
    <Statistic icon="flag" label="User Flags" data={props.route?.ui_derived?.flags} /> 
  </div>
}
