import {
  createEffect, createResource, createSignal, For, Index, onCleanup, onMount, Show, Suspense, type VoidComponent,
} from 'solid-js'
import dayjs from 'dayjs'

import { fetcher } from '~/api'
import { getTimelineStatistics, TimelineStatistics } from '~/api/derived'
import Icon from '~/components/material/Icon'
import { ListItem, ListItemContent } from '~/components/material/List'
import { getPlaceName } from '~/map/geocode'
import type { RouteSegments } from '~/types'
import { formatDistance, formatRouteDuration } from '~/utils/format'
import { useDimensions } from '~/utils/window'
import Avatar from '~/components/material/Avatar'


const formatEngagement = (timeline: TimelineStatistics): string => {
  const { engagedDuration, duration } = timeline
  return `${(100 * (engagedDuration / duration)).toFixed(0)}%`
}


interface RouteItemProps {
  route: RouteSegments
}

const RouteItem: VoidComponent<RouteItemProps> = (props) => {
  const startTime = () => dayjs(props.route.start_time_utc_millis)
  // const endTime = () => dayjs(props.route.end_time_utc_millis)

  const startPosition = () => [props.route.start_lng || 0, props.route.start_lat || 0] as number[]
  const [startName] = createResource(startPosition, getPlaceName)

  const [timeline] = createResource(() => props.route, getTimelineStatistics)

  return (
    <ListItem
      variant="2-line"
      href={`/${props.route.dongle_id}/${props.route.fullname.slice(17)}`}
      activeClass="md:before:bg-primary"
      trailing={<Suspense><Show when={timeline()?.userFlags}><Avatar><Icon>flag</Icon></Avatar></Show></Suspense>}
    >
      <ListItemContent
        class="flex flex-col gap-2"
        headline={<div class="flex gap-2">
          <div>{startTime().format('MMM D, YYYY')}</div>
          &middot;
          <div>{startTime().format('h:mm A')}</div>
        </div>}
        subhead={<div class="flex flex-wrap gap-4">
          <div class="flex gap-2">
            <Icon class="text-on-surface-variant" size="20">timer</Icon>
            <span class="font-mono uppercase">{formatRouteDuration(props.route)}</span>
          </div>

          <div class="flex gap-2">
            <Icon class="text-on-surface-variant" size="20">route</Icon>
            <span class="font-mono uppercase">{formatDistance(props.route?.length)}</span>
          </div>

          <Suspense>
            <Show when={timeline()} keyed>{(timeline) => <div class="flex gap-2">
              <Icon class="text-on-surface-variant" size="20">search_hands_free</Icon>
              {formatEngagement(timeline)} engaged
            </div>}</Show>
          </Suspense>

          <Suspense>
            <Show when={startName()} keyed>{(startName) => <div class="flex gap-2">
              <Icon class="text-on-surface-variant" size="20">location_on</Icon>
              {startName}
            </div>}</Show>
          </Suspense>
        </div>}
      />
    </ListItem>
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
    <div class="flex w-full flex-col justify-items-stretch overflow-hidden rounded-md">
      <For each={pageNumbers()}>
        {(_, i) => {
          const [routes] = createResource(() => i(), getPage)
          return (
            <Suspense fallback={<Index each={new Array(pageSize())}>{() => (
              <div class="skeleton-loader flex h-[140px] flex-col rounded-lg" />
            )}</Index>}>
              <For each={routes()}>
                {(route) => <RouteItem route={route} />}
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
