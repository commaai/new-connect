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
    return <div class="flex size-full basis-1/4 flex-col">
      <div class="flex basis-1/2 flex-col items-center justify-center space-x-2 lg:flex-row lg:items-end">
        <Icon class="hidden text-on-secondary-container lg:block">{statisticProps.icon}</Icon>
        <h1>{statisticProps?.data}</h1>
      </div>
      <div class="flex basis-1/2 items-center justify-center">
        <p class="text-xs text-on-secondary-container lg:text-sm">{statisticProps.label}</p>
      </div>
    </div>
  }

  return <div class="mb-2 flex h-full w-screen items-center justify-center rounded-md lg:w-full lg:flex-col">
    <Statistic icon="map" label="Distance" data={`${props.route?.ui_derived?.distance}mi`} />
    <Statistic icon="timer" label="Duration" data={formatRouteDuration(props.route?.ui_derived?.duration)} />
    <Statistic icon="search_hands_free" label="Engagement" data={`${props.route?.ui_derived?.engagement}%`} />
    <Statistic icon="flag" label="User Flags" data={props.route?.ui_derived?.flags} /> 
  </div>
}
