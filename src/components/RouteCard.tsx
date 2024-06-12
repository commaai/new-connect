import { createSignal, createEffect, Suspense, type VoidComponent } from 'solid-js'
import dayjs from 'dayjs'

import Avatar from '~/components/material/Avatar'
import Card, { CardContent, CardHeader } from '~/components/material/Card'
import Icon from '~/components/material/Icon'
import RouteStaticMap from '~/components/RouteStaticMap'
import RouteStatistics from '~/components/RouteStatistics'
import Timeline from './Timeline'

import { reverseGeocode } from '~/map'
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

const RouteRevGeo = (props: { route: Route }) => {
  const [startLocation, setStartLocation] = createSignal(null);
  const [endLocation, setEndLocation] = createSignal(null);

  createEffect(async () => {
    const {start_lng, start_lat, end_lng, end_lat} = props.route;

    if (!start_lng || !start_lat || !end_lng || !end_lat) return;

    try {
      const start_revGeo = await reverseGeocode(start_lng, start_lat);
      const end_revGeo = await reverseGeocode(end_lng, end_lat);

      const { neighborhood: startNeighborhood, region: startRegion } = start_revGeo?.features[0].properties?.context || {};
      const { neighborhood: endNeighborhood, region: endRegion } = end_revGeo?.features[0].properties?.context || {};

      setStartLocation({ neighborhood: startNeighborhood?.name, region: startRegion?.region_code });
      setEndLocation({ neighborhood: endNeighborhood?.name, region: endRegion?.region_code });
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <div class='flex gap-2 items-center px-4 py-1' style={{ "font-size": '13px', width: 'fit-content', background: '#000', "border-radius": '10px', "border": '1px solid #4b4b4b' }}>
      {startLocation() && <div>{startLocation().neighborhood}, {startLocation().region}</div>}
      <span class="material-symbols-outlined icon-outline" style={{ "font-size": '14px'}}>
        arrow_right_alt
      </span>
      {endLocation() && <div>{endLocation().neighborhood}, {endLocation().region}</div>}
    </div>
  );
}

const RouteCard: VoidComponent<RouteCardProps> = (props) => {
  const route = () => props.route

  return (
    <Card href={`/${props.route.dongle_id}/${props.route.fullname.slice(17)}`} class="flex flex-col md:flex-row flex-shrink-0 card-fit-width">
      <div class="overflow-hidden md:max-w-[400px]">
        <Suspense
          fallback={<div class="skeleton-loader size-full bg-surface" />}
        >
          <RouteStaticMap route={props.route} />
        </Suspense>
      </div>

      <div class="flex flex-col">
        <RouteHeader route={props.route} />

        <CardContent class='py-0'>
          <RouteRevGeo route={props.route} />
          <Timeline route={route()} />
          <RouteStatistics route={props.route} />
        </CardContent>
      </div>
    </Card>
  )
}

export default RouteCard
