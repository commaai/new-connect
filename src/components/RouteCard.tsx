import { createSignal, createEffect, Suspense, Show, type Component } from 'solid-js'
import dayjs from 'dayjs'

import Avatar from '~/components/material/Avatar'
import { CardContent, CardHeader } from '~/components/material/Card'
import Icon from '~/components/material/Icon'
import RouteOptions from '~/components/RouteOptions'
import RouteStaticMap from '~/components/RouteStaticMap'
import RouteStatistics from '~/components/RouteStatistics'
import Timeline from './Timeline'

import type { Route, RouteSegments } from '~/types'

import { reverseGeocode } from '~/map'

type RouteOptionsProps = {
  route?: Route;
}

const [showRouteOptionsCard, setShowRouteOptionsCard] = createSignal(false)

const RouteOptionsCard: Component<RouteOptionsProps> = (props) => {
  const [isMdOrLarger, setIsMdOrLarger] = createSignal(false)

  // listen isMdOrLarger
  createEffect(() => {
    const updateSize = () => {
      setIsMdOrLarger(window.innerWidth >= 768)
    }
    window.addEventListener('resize', updateSize)
    // Initial check
    updateSize() 

    return () => window.removeEventListener('resize', updateSize)
  })

  const stopPropagation = (event: MouseEvent) => {
    event.stopPropagation()

    setShowRouteOptionsCard(false)
  }

  return (
    <Show when={showRouteOptionsCard()}>
      <div onClick={stopPropagation} classList={{
        'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition duration-800 ease-in-out': isMdOrLarger(),
        'fixed inset-0 z-50 flex flex-col-reverse bg-black bg-opacity-50 p-4 transition duration-800 ease-in-out': !isMdOrLarger(),
        'transform translate-y-0': !isMdOrLarger() && showRouteOptionsCard(),
        'transform translate-y-full': !isMdOrLarger() && !showRouteOptionsCard(),
      }}>
        <div onClick={(event: MouseEvent) => event.stopPropagation()}>
          <RouteOptions {...props} />
        </div>
      </div>
    </Show>
  )
}

type FavoriteRoutes = string[]

const RouteHeader = (props: { route?: RouteSegments }) => {

  const startTime = () => props?.route?.segment_start_times ? dayjs(props.route.segment_start_times[0]) : null
  const endTime = () => props?.route?.segment_end_times ? dayjs(props.route.segment_end_times.at(-1)) : null

  const headline = () => startTime()?.format('ddd, MMM D, YYYY')
  const subhead = () => `${startTime()?.format('h:mm A')} to ${endTime()?.format('h:mm A')}`

  const [isFavorite, setIsFavorite] = createSignal(false)

  const toggleFavorite = (routeName: string) => {
    let favorites: FavoriteRoutes = JSON.parse(localStorage.getItem('favoriteRoutes') || '[]') as FavoriteRoutes
    const isFavorite = favorites.includes(routeName)
    favorites = isFavorite ? favorites.filter(name => name !== routeName) : [...favorites, routeName]
    localStorage.setItem('favoriteRoutes', JSON.stringify(favorites))
    setIsFavorite(!isFavorite)
  }

  createEffect(() => {
    const favorites: FavoriteRoutes = JSON.parse(localStorage.getItem('favoriteRoutes') || '[]') as FavoriteRoutes
    setIsFavorite(favorites.includes(props.route?.fullname ?? ''))
  })

  const handleLikeClick = (event: MouseEvent) => {
    event.stopPropagation()
    props.route?.fullname && toggleFavorite(props.route.fullname)
  }

  const handleMoreOptionsClick = (event: MouseEvent) => {
    event.stopPropagation()
    setShowRouteOptionsCard(true)
  }

  return (
    <CardHeader
      headline={headline()}
      subhead={subhead()}
      leading={
        <Avatar>
          <Icon>directions_car</Icon>
        </Avatar>
      }
      trailing={
        <div class="flex items-center gap-3.5">
          <button onClick={(event) => handleLikeClick(event)}>
            <Icon filled={isFavorite()} class={isFavorite() ? 'text-red-400 hover:text-white' : 'text-white hover:text-red-400'}>favorite_border</Icon>
          </button>
          <button class="hover:text-blue-400" onClick={(event) => handleMoreOptionsClick(event)}>
            <Icon>more_vert</Icon>
          </button>
        </div>
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

async function fetchGeoData(lng: number, lat: number): Promise<GeoResult | null> {
  try {
    const revGeoResult = await reverseGeocode(lng, lat) as GeoResult
    if (revGeoResult instanceof Error) throw revGeoResult
    return revGeoResult
  } catch (error) {
    console.error(error)
    // To allow execution to continue for the next location.
    return null
  }
}

function processGeoResult(
  result: GeoResult | null, 
  setLocation: (location: { neighborhood?: string | null, region?: string | null }) => void,
) {
  if (result) {
    const { neighborhood, region, place } = 
      (result?.features?.[0]?.properties?.context || {}) as LocationContext
    setLocation({
      neighborhood: neighborhood?.name || place?.name,
      region: region?.region_code,
    })
  }
}

type LocationState = { neighborhood?: string | null, region?: string | null }

const RouteRevGeo = (props: { route?: Route }) => {
  const [startLocation, setStartLocation] = createSignal<LocationState>({ 
    neighborhood: null, 
    region: null, 
  })
  const [endLocation, setEndLocation] = createSignal<LocationState>({ 
    neighborhood: null, 
    region: null, 
  })
  const [error, setError] = createSignal<Error | null>(null)

  createEffect(() => {
    if (!props.route) return
    const { start_lng, start_lat, end_lng, end_lat } = props.route
    if (!start_lng || !start_lat || !end_lng || !end_lat) return

    Promise.all([
      fetchGeoData(start_lng, start_lat),
      fetchGeoData(end_lng, end_lat),
    ]).then(([startResult, endResult]) => {
      processGeoResult(startResult, setStartLocation)
      processGeoResult(endResult, setEndLocation)
    }).catch((error) => {
      setError(error as Error)
      console.error('An error occurred while fetching geolocation data:', error)
    })
  })

  return (
    <div>
      {error() && <div>Error: {error()?.message}</div>}
      <div class="flex w-fit items-center gap-2 rounded-xl border border-gray-700 bg-black px-4 py-1 text-[13px]">
        {startLocation().neighborhood && <div>{startLocation().neighborhood}, {startLocation().region}</div>}
        <span class="material-symbols-outlined icon-outline" style={{ 'font-size': '14px' }}>
          arrow_right_alt
        </span>
        {endLocation().neighborhood && <div>{endLocation().neighborhood}, {endLocation().region}</div>}
      </div>
    </div>
  )
}

type RouteCardProps = {
  route?: Route;
}

const RouteCard: Component<RouteCardProps> = (props) => {
  const route = () => props.route

  const navigateToRouteActivity = () => {
    location.href = `/${route()?.dongle_id}/${route()?.fullname?.slice(17)}`
  }

  return (
    <div class="custom-card flex shrink-0 flex-col rounded-lg md:flex-row" onClick={navigateToRouteActivity}>
      <RouteOptionsCard route={route()} />
      <div class="h-full lg:w-[410px]">
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
  )
}

export default RouteCard
