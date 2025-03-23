import { createEffect, createResource, createSignal, For, Index, onCleanup, onMount, Suspense, type VoidComponent } from 'solid-js'
import dayjs from 'dayjs'

import { fetcher } from '~/api'
import Card, { CardContent, CardHeader } from '~/components/material/Card'
import RouteStatistics from '~/components/RouteStatistics'
import { getPlaceName } from '~/map/geocode'
import type { RouteSegments } from '~/types'
import { useDimensions } from '~/utils/window'

interface RouteCardProps {
  route: RouteSegments
}

const RouteCard: VoidComponent<RouteCardProps> = (props) => {
  const startTime = () => dayjs(props.route.start_time_utc_millis)
  const endTime = () => dayjs(props.route.end_time_utc_millis)
  const startPosition = () => [props.route.start_lng || 0, props.route.start_lat || 0] as number[]
  const endPosition = () => [props.route.end_lng || 0, props.route.end_lat || 0] as number[]
  const [startPlace] = createResource(startPosition, getPlaceName)
  const [endPlace] = createResource(endPosition, getPlaceName)
  const [location] = createResource(
    () => [startPlace(), endPlace()],
    ([startPlace, endPlace]) => {
      if (!startPlace && !endPlace) return ''
      if (!endPlace || startPlace === endPlace) return startPlace
      if (!startPlace) return endPlace
      return `${startPlace} to ${endPlace}`
    },
  )

  return (
    <Card class="max-w-none" href={`/${props.route.dongle_id}/${props.route.fullname.slice(17)}`} activeClass="md:before:bg-primary">
      <CardHeader
        headline={
          <div class="flex gap-2">
            <span>{startTime().format('ddd, MMM D, YYYY')}</span>&middot;
            <span>
              {startTime().format('h:mm A')} to {endTime().format('h:mm A')}
            </span>
          </div>
        }
        subhead={location()}
      />

      <CardContent>
        <RouteStatistics route={props.route} />
      </CardContent>
    </Card>
  )
}

type RouteListProps = {
  dongleId: string
}

const RouteList: VoidComponent<RouteListProps> = (props) => {
  const dimensions = useDimensions()
  const pageSize = () => Math.max(Math.ceil(dimensions().height / 2 / 140), 1)
  const endpoint = () => `/v1/devices/${props.dongleId}/routes_segments?limit=${pageSize()}`
  const getKey = (previousPageData?: RouteSegments[]): string | undefined => {
    if (!previousPageData) return endpoint()
    if (previousPageData.length === 0) return undefined
    return `${endpoint()}&end=${previousPageData.at(-1)!.start_time_utc_millis - 1}`
  }
  const getPage = (page: number): Promise<RouteSegments[]> => {
    if (pages[page] === undefined) {
      pages[page] = (async () => {
        const previousPageData = page > 0 ? await getPage(page - 1) : undefined
        const key = getKey(previousPageData)
        return key ? fetcher<RouteSegments[]>(key) : []
      })()
    }
    return pages[page]
  }

  const pages: Promise<RouteSegments[]>[] = []
  const [size, setSize] = createSignal(1)
  const pageNumbers = () => Array.from({ length: size() })

  createEffect(() => {
    if (props.dongleId) {
      pages.length = 0
      setSize(1)
    }
  })

  const [sentinel, setSentinel] = createSignal<HTMLDivElement>()
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        setSize((prev) => prev + 1)
      }
    },
    { threshold: 0.1 },
  )
  onMount(() => {
    const sentinelEl = sentinel()
    if (sentinelEl) {
      observer.observe(sentinelEl)
    }
  })
  onCleanup(() => observer.disconnect())

  return (
    <div class="flex w-full flex-col justify-items-stretch gap-4">
      <For each={pageNumbers()}>
        {(_, i) => {
          const [routes] = createResource(() => i(), getPage)
          return (
            <Suspense
              fallback={
                <Index each={new Array(pageSize())}>{() => <div class="skeleton-loader flex h-[140px] flex-col rounded-lg" />}</Index>
              }
            >
              <For each={routes()}>{(route) => <RouteCard route={route} />}</For>
            </Suspense>
          )
        }}
      </For>
      <div ref={setSentinel} class="h-10 w-full" />
    </div>
  )
}

export default RouteList
