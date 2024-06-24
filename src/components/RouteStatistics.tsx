import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

import type { Route } from '~/types'
import { formatRouteDuration } from '~/utils/date'

type RouteStatisticsProps = {
  class?: string
  route?: Route
}

const RouteStatistics: VoidComponent<RouteStatisticsProps> = (props) => {
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

export default RouteStatistics
