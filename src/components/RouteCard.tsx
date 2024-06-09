import { Suspense, type VoidComponent } from 'solid-js'
import dayjs from 'dayjs'

import Avatar from '~/components/material/Avatar'
import Card, { CardContent, CardHeader } from '~/components/material/Card'
import Icon from '~/components/material/Icon'
import RouteStaticMap from '~/components/RouteStaticMap'
import RouteStatistics from '~/components/RouteStatistics'

import type { Route } from '~/types'

const RouteHeader = (props: { route: Route }) => {
  const startTime = () => dayjs(props.route.segment_start_times[0])
  const endTime = () =>
    dayjs(
      props.route.segment_end_times[props.route.segment_end_times.length - 1],
    )

  const headline = () => startTime().format('ddd, MMM D, YYYY')
  const subhead = () =>
    `${startTime().format('h:mm A')} to ${endTime().format('h:mm A')}`

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

interface RouteCardProps {
  route: Route
}

const RouteCard: VoidComponent<RouteCardProps> = (props) => {
  return (
    <Card href={`/${props.route.dongle_id}/${props.route.fullname.slice(17)}`}>
      <RouteHeader route={props.route} />

      <div class="mx-2 h-48 overflow-hidden rounded-lg">
        <Suspense
          fallback={<div class="skeleton-loader size-full bg-surface" />}
        >
          <RouteStaticMap route={props.route} />
        </Suspense>
      </div>

      <CardContent>
        <RouteStatistics route={props.route} />
      </CardContent>
    </Card>
  )
}

export default RouteCard
