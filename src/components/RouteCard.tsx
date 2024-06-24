import { Show, type VoidComponent, useContext } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import dayjs from 'dayjs'

import Icon from '~/components/material/Icon'
import RouteStaticMap from '~/components/RouteStaticMap'
import RouteStatistics from '~/components/RouteStatistics'

import type { RouteSegments } from '~/types'
import { DashboardContext, generateContextType } from '~/pages/dashboard/Dashboard'
import Timeline from './Timeline'

interface RouteCardProps {
  route: RouteSegments
}

const RouteCard: VoidComponent<RouteCardProps> = (props) => {

  const { width, isDesktop } = useContext(DashboardContext) ?? generateContextType()
  const navigate = useNavigate()

  const startTime = () => dayjs(props.route.segment_start_times[0])
  const endTime = () => dayjs(props.route.segment_end_times.at(-1))

  const headline = () => startTime().format('dddd, MMM D, YYYY')
  const subhead = () => `${startTime().format('h:mm A')} to ${endTime().format('h:mm A')}`

  return (
    <div onClick={() => {
      const path = props.route.fullname.split('|')
      const url = `/${path[0]}/${path[1]}`
      navigate(url)
    }} class="my-2 flex h-44 w-full animate-exist rounded-md border border-secondary-container hover:bg-secondary-container">
      <Show when={width() > 23 && isDesktop()}>
        <div class="flex basis-1/4 items-center justify-center">
          <div class="size-10/12">
            <RouteStaticMap route={props.route} />
          </div>
        </div>
      </Show>
      <div class={`flex ${width() <= 23 || !isDesktop() ? 'basis-full' : 'basis-3/4'} flex-col justify-center p-4`}>
        <h2 class="text-lg">{headline()}</h2>
        <p class="text-sm text-neutral-600">{subhead()}</p>
        <Show when={props.route.ui_derived?.address}>
          <div class={`mt-1 ${width() > 23 ? 'flex w-full sm:w-3/4':'inline-flex'} h-6 items-center justify-center space-x-3 rounded-sm bg-black`}>
            <p class="text-xs">{props.route.ui_derived?.address?.start}</p>
            <Icon size="20">arrow_forward</Icon>
            <p class="text-xs">{props.route.ui_derived?.address?.end}</p>
          </div>
        </Show>
        <Timeline routeName={props.route.fullname} class="my-2 h-[5px]" />
        <RouteStatistics route={props.route} />
      </div>
    </div>
  )
}

export default RouteCard
