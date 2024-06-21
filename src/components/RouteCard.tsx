import { createSignal, createEffect, Suspense, type VoidComponent } from 'solid-js'
import dayjs from 'dayjs'

import Avatar from '~/components/material/Avatar'
import { CardContent, CardHeader } from '~/components/material/Card'
import Icon from '~/components/material/Icon'
import RouteStaticMap from '~/components/RouteStaticMap'
import RouteStatistics from '~/components/RouteStatistics'
import Timeline from './Timeline'

import type { Route, RouteSegments } from '~/types'

import { reverseGeocode } from '~/map'

const RouteHeader = (props: { route?: RouteSegments }) => {
  const startTime = () => props?.route?.segment_start_times ? dayjs(props.route.segment_start_times[0]) : null
  const endTime = () => props?.route?.segment_end_times ? dayjs(props.route.segment_end_times.at(-1)) : null

  const headline = () => startTime()?.format('ddd, MMM D, YYYY')
  const subhead = () => `${startTime()?.format('h:mm A')} to ${endTime()?.format('h:mm A')}`

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

interface GeoResult {
  features?: Array<{
    properties?: {
      context?: {
        neighborhood?: string | null,
        region?: string | null,
        place?: string | null
      }
    }
  }>
}

interface LocationContext {
  neighborhood?: {
    name: string | null,
  },
  region?: {
    region_code: string | null,
  },
  place?: {
    name: string | null,
  }
}

const RouteRevGeo = (props: { route?: Route }) => {
  const [startLocation, setStartLocation] = createSignal<{
    neighborhood?: string | null,
    region?: string | null
  }>({ neighborhood: null, region: null })

  const [endLocation, setEndLocation] = createSignal<{
    neighborhood?: string | null,
    region?: string | null
  }>({ neighborhood: null, region: null })

  const [error, setError] = createSignal<Error | null>(null)

  createEffect(() => {
    if (!props.route) return

    const { start_lng, start_lat, end_lng, end_lat } = props.route

    if (!start_lng || !start_lat || !end_lng || !end_lat) return

    const fetchGeoData = async () => {
      try {
        const start_revGeoResult = await reverseGeocode(start_lng, start_lat) as GeoResult
        const end_revGeoResult = await reverseGeocode(end_lng, end_lat) as GeoResult

        if (start_revGeoResult instanceof Error) {
          setError(start_revGeoResult as Error)
          console.error(start_revGeoResult)
          return
        }

        if (end_revGeoResult instanceof Error) {
          setError(end_revGeoResult as Error)
          console.error(end_revGeoResult)
          return
        }

        const { neighborhood: startNeighborhood, region: startRegion, place: startPlace } =
          (start_revGeoResult?.features?.[0]?.properties?.context || {}) as LocationContext

        const { neighborhood: endNeighborhood, region: endRegion, place: endPlace } =
          (end_revGeoResult?.features?.[0]?.properties?.context || {}) as LocationContext

        setStartLocation({
          neighborhood: startNeighborhood?.name || startPlace?.name,
          region: startRegion?.region_code,
        })
        setEndLocation({
          neighborhood: endNeighborhood?.name || endPlace?.name,
          region: endRegion?.region_code,
        })
      } catch (error) {
        setError(error as Error)
        console.error(error)
      }
    }

    fetchGeoData().catch((error) => {
      console.error('An error occurred while fetching geolocation data:', error)
    })
  })

  return (
    <div>
      {error() && <div>Error: {error()?.message}</div>}
      <div class="flex w-fit items-center gap-2 rounded-xl border border-gray-700 bg-black px-4 py-1 text-[13px]">
        {startLocation() && <div>{startLocation()?.neighborhood}, {startLocation()?.region}</div>}
        <span class="material-symbols-outlined icon-outline" style={{ 'font-size': '14px' }}>
          arrow_right_alt
        </span>
        {endLocation() && <div>{endLocation()?.neighborhood}, {endLocation()?.region}</div>}
      </div>
    </div>
  )
}

type RouteCardProps = {
  route?: Route;
}

const RouteCard: VoidComponent<RouteCardProps> = (props) => {
  const route = () => props.route

  return (
    <a href={`/${route()?.dongle_id}/${route()?.fullname?.slice(17)}`}>
      <div class="custom-card flex shrink-0 flex-col rounded-lg md:flex-row">
        <div class="h-full w-[410px]">
          <Suspense
            fallback={<div class="skeleton-loader size-full bg-surface" />}
          >
            <RouteStaticMap route={route()} />
          </Suspense>
        </div>

        <div class="flex flex-col">
          <RouteHeader route={route()} />

          <CardContent class="py-0">
            <RouteRevGeo route={route()} />
            <Timeline route={route()} rounded="rounded-sm" />
            <RouteStatistics route={route()} />
          </CardContent>
        </div>
      </div>
    </a>
  )
}

export default RouteCard
