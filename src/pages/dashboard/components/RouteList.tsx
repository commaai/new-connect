import {
  createEffect,
  createResource,
  createSignal,
  For,
  Index,
  onCleanup,
  onMount,
  Suspense,
  type VoidComponent,
} from 'solid-js'
import dayjs from 'dayjs'

import { fetcher } from '~/api'
import type { RouteSegments } from '~/types'

import Card, { CardContent, CardHeader } from '~/components/material/Card'
import RouteStaticMap from '~/components/RouteStaticMap'
import RouteStatistics from '~/components/RouteStatistics'


interface RouteCardProps {
  route: RouteSegments
}

const RouteCard: VoidComponent<RouteCardProps> = (props) => {
  const startTime = () => dayjs(props.route.start_time_utc_millis)
  const endTime = () => dayjs(props.route.end_time_utc_millis)

  return (
    <Card href={`/${props.route.dongle_id}/${props.route.fullname.slice(17)}`}>
      <CardHeader
        headline={startTime().format('ddd, MMM D, YYYY')}
        subhead={`${startTime().format('h:mm A')} to ${endTime().format('h:mm A')}`}
      />

      <div class="mx-2 h-48 overflow-hidden rounded-lg">
        <Suspense fallback={<div class="skeleton-loader size-full bg-surface" />}>
          <RouteStaticMap route={props.route} />
        </Suspense>
      </div>

      <CardContent>
        <RouteStatistics route={props.route} />
      </CardContent>
    </Card>
  )
}


const PAGE_SIZE = 3

type RouteListProps = {
  dongleId: string
}

const RouteList: VoidComponent<RouteListProps> = (props) => {
  const endpoint = () => `/v1/devices/${props.dongleId}/routes_segments?limit=${PAGE_SIZE}`
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
              fallback={<Index each={new Array(PAGE_SIZE)}>{() => (
                <div class="skeleton-loader elevation-1 flex h-[336px] max-w-md flex-col rounded-lg bg-surface-container-low" />
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
