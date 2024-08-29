import { Suspense, type VoidComponent, createSignal, Show } from 'solid-js'
import dayjs from 'dayjs'

import Avatar from '~/components/material/Avatar'
import Card, { CardContent, CardHeader } from '~/components/material/Card'
import Icon from '~/components/material/Icon'
import RouteStaticMap from '~/components/RouteStaticMap'
import RouteStatistics from '~/components/RouteStatistics'
import RouteCardExpanded from '~/components/RouteCardExpanded'

import type { RouteSegments } from '~/types'

const RouteHeader = (props: { route: RouteSegments }) => {
  const startTime = () => dayjs(props.route.start_time_utc_millis)
  const endTime = () => dayjs(props.route.end_time_utc_millis)

  const headline = () => startTime().format('ddd, MMM D, YYYY')
  const subhead = () => `${startTime().format('h:mm A')} to ${endTime().format('h:mm A')}`

  return (
    <CardHeader
      headline={headline()}
      subhead={subhead()}
      leading={
        <Avatar>
          <Icon>directions_car</Icon>
        </Avatar>
      }
    />
  )
}

const RouteMap: VoidComponent<{ route: RouteSegments }> = (props) => (
  <div class="mx-2 h-48 overflow-hidden rounded-lg">
    <Suspense
      fallback={<div class="skeleton-loader size-full bg-surface" />}
    >
      <RouteStaticMap route={props.route} />
    </Suspense>
  </div>
)

const ExpandButton: VoidComponent<{ expanded: () => boolean, onToggle: () => void }> = (props) => {
  return (
    <button 
      class="flex w-full cursor-pointer justify-center rounded-b-lg bg-surface-container-lowest p-2 hover:bg-black/45"
      onClick={() => props.onToggle()}
      style={{
        'border': props.expanded() ? '2px solid' : '1px solid',
        'border-color': props.expanded() ? 'var(--color-surface-container-high)' : 'var(--color-surface-container-lowest)',
      }}
    >
      <Icon class={props.expanded() ? 'text-yellow-400' : 'text-zinc-500'}>
        {props.expanded() ? 'expand_less' : 'expand_more'}
      </Icon>
    </button>
  )
}

interface RouteCardProps {
  route: RouteSegments
}

const RouteCard: VoidComponent<RouteCardProps> = (props) => {
  const [expanded, setExpanded] = createSignal(false)

  return (
    <div class="flex max-w-md flex-col">
      <Card 
        href={`/${props.route.dongle_id}/${props.route.fullname.slice(17)}`} 
        class="rounded-b-none"
      >
        <RouteHeader route={props.route} />
        <RouteMap route={props.route} />
        <CardContent>
          <RouteStatistics route={props.route} />
        </CardContent>
      </Card>
      
      <Show when={expanded()}>
        <RouteCardExpanded
          routeName={props.route.fullname}
          initialPublic={props.route.is_public}
          initialPreserved={props.route.is_preserved}
        />
      </Show>
      <ExpandButton expanded={expanded} onToggle={() => setExpanded(prev => !prev)} />
    </div>
  )
}

export default RouteCard
