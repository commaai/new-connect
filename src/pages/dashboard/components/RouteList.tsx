import {
  createEffect,
  createResource,
  createSignal,
  For,
  Index,
  onCleanup,
  onMount,
  Show,
  Suspense,
  type VoidComponent,
} from 'solid-js'

import { fetcher } from '~/api'
import { getTimelineStatistics, TimelineStatistics } from '~/api/derived'
import Card, { CardContent, CardHeader } from '~/components/material/Card'
import Icon from '~/components/material/Icon'
import type { RouteSegments } from '~/types'
import { formatDateRange, formatRouteDistance, formatRouteDuration, formatTimeRange } from '~/utils/date'
import { useDimensions } from '~/utils/window'


const getEngagement = (timeline?: TimelineStatistics): string | null => {
  if (!timeline) return null
  const { engagedDuration, duration } = timeline
  if (!duration) return null
  return `${(100 * (engagedDuration / duration)).toFixed(0)}%`
}


interface RouteCardProps {
  route: RouteSegments
}

const RouteCard: VoidComponent<RouteCardProps> = (props) => {
  const dateRange = () => formatDateRange(props.route.start_time_utc_millis, props.route.end_time_utc_millis)
  const timeRange = () => formatTimeRange(props.route.start_time_utc_millis, props.route.end_time_utc_millis)
  const [timeline] = createResource(() => props.route, getTimelineStatistics)

  return (
    <Card
      class="max-w-none"
      href={`/${props.route.dongle_id}/${props.route.fullname.slice(17)}`}
      activeClass="md:before:bg-primary"
    >
      <CardHeader
        headline={dateRange()}
        subhead={timeRange()}
        trailing={<div class="flex flex-row gap-2">
          <Icon size="24">route</Icon>
          {formatRouteDistance(props.route)}
        </div>}
      />

      <CardContent>
        <div class="grid gap-2 grid-cols-3 whitespace-nowrap">
          <div class="flex items-center gap-2">
            <Icon size="20">schedule</Icon>
            {formatRouteDuration(props.route)}
          </div>
          <Suspense fallback={<div class="flex h-6"><div class="skeleton-loader size-full" /></div>}>
            <Show when={getEngagement(timeline())}>{(engagement) => (
              <div class="hidden items-center gap-2 xs:flex">
                <Icon size="20">speed</Icon>
                <span>Engaged: {engagement()}</span>
              </div>
            )}</Show>
          </Suspense>
          <Suspense fallback={<div class="flex h-6"><div class="skeleton-loader size-full" /></div>}>
            <Show when={timeline()}>{(timeline) => (
              <div class="flex items-center gap-2 justify-self-end ps-2">
                <Icon size="20">flag</Icon>
                <span>{timeline()?.userFlags} <span class="hidden xs:inline">user</span> flags</span>
              </div>
            )}</Show>
          </Suspense>
        </div>
      </CardContent>
    </Card>
  )
}


type RouteListProps = {
  dongleId: string
}

const RouteList: VoidComponent<RouteListProps> = (props) => {
  const dimensions = useDimensions()
  const pageSize = () => Math.max(Math.ceil((dimensions().height / 2) / 140), 1)
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
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      setSize((prev) => prev + 1)
    }
  }, { threshold: 0.1 })
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
              fallback={<Index each={new Array(pageSize())}>{() => (
                <div class="skeleton-loader flex h-[140px] flex-col rounded-lg" />
              )}</Index>}
            >
              <For each={routes()}>
                {(route) => <RouteCard route={route} />}
              </For>
            </Suspense>
          )
        }}
      </For>
      <div ref={setSentinel} class="h-10 w-full" />
    </div>
  )
}

export default RouteList
