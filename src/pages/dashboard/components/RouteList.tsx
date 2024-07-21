import {
  createEffect,
  createSignal,
  For,
  Suspense,
  createResource,
  onCleanup,
} from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

import type { RouteSegments } from '~/types'
import RouteCard from '~/components/RouteCard'
import RouteSorter from '~/components/RouteSorter'
import { SortOption, SortKey, sortRoutes, SortOrder } from '~/utils/sorting'
import { fetchRoutesWithStats, PAGE_SIZE, DEFAULT_DAYS } from '~/api/derived'

interface RouteSegmentsWithStats extends RouteSegments {
  timelineStatistics: {
    duration: number
    engagedDuration: number
    userFlags: number
  }
}

type RouteListProps = {
  class?: string
  dongleId: string
}

const fetchRoutes = async (dongleId: string, days: number): Promise<RouteSegmentsWithStats[]> => {
  return await fetchRoutesWithStats(dongleId, days)
}

const RouteList: VoidComponent<RouteListProps> = (props) => {
  const [sortOption, setSortOption] = createSignal<SortOption>({ label: 'Date', key: 'date', order: 'desc' })
  const [allRoutes, setAllRoutes] = createSignal<RouteSegmentsWithStats[]>([])
  const [sortedRoutes, setSortedRoutes] = createSignal<RouteSegmentsWithStats[]>([])
  const [days, setDays] = createSignal(DEFAULT_DAYS)
  const [hasMore, setHasMore] = createSignal(true)
  const [loading, setLoading] = createSignal(true)

  const [routesResource, { refetch }] = createResource(
    () => `${props.dongleId}-${days()}`,
    async () => {
      setLoading(true)
      const routes = await fetchRoutes(props.dongleId, days())
      setLoading(false)
      return routes
    },
  )

  createEffect(() => {
    const routes: RouteSegmentsWithStats[] = routesResource()?.map(route => ({
      ...route,
      timelineStatistics: route.timelineStatistics || { duration: 0, engagedDuration: 0, userFlags: 0 },
    })) || []

    if (routes.length < PAGE_SIZE) {
      setHasMore(false)
    }

    setAllRoutes(routes)
    console.log('Updated allRoutes:', routes.length)
  })

  createEffect(() => {
    const routes = allRoutes()
    const currentSortOption = sortOption()
    console.log('Sorting effect triggered:', { routesCount: routes.length, currentSortOption })
    if (routes.length > 0) {
      const sorted = sortRoutes(routes, currentSortOption)
      setSortedRoutes(sorted)
      console.log('Sorted routes:', sorted.length)
    } else {
      setSortedRoutes(routes)
    }
  })

  const handleSortChange = (key: SortKey) => {
    let newOrder: SortOrder | null = 'desc'
    const currentSort = sortOption()

    if (currentSort.key === key) {
      if (currentSort.order === 'desc') {
        newOrder = 'asc'
      } else if (currentSort.order === 'asc') {
        newOrder = null
      }
    }

    if (newOrder === null) {
      console.log('Reverting to default sort')
      setSortOption({ label: 'Date', key: 'date', order: 'desc' })
    } else {
      console.log(`Changing sort to ${key} ${newOrder}`)
      setSortOption({ label: key.charAt(0).toUpperCase() + key.slice(1), key, order: newOrder })
    }
  }

  let bottomRef: HTMLDivElement | undefined
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore() && !loading()) {
        setLoading(true)
        setDays((days) => days + DEFAULT_DAYS)
        void refetch()
      }
    },
    { rootMargin: '200px' },
  )

  createEffect(() => {
    if (bottomRef) {
      observer.observe(bottomRef)
    }
    return () => {
      if (bottomRef) observer.unobserve(bottomRef)
    }
  })

  onCleanup(() => observer.disconnect())

  return (
    <div class={clsx('flex w-full flex-col justify-items-stretch gap-4', props.class)}>
      <RouteSorter onSortChange={handleSortChange} currentSort={sortOption()} />
      <Suspense
        fallback={
          <>
            <div class="skeleton-loader elevation-1 flex h-[336px] max-w-md flex-col rounded-lg bg-surface-container-low" />
            <div class="skeleton-loader elevation-1 flex h-[336px] max-w-md flex-col rounded-lg bg-surface-container-low" />
            <div class="skeleton-loader elevation-1 flex h-[336px] max-w-md flex-col rounded-lg bg-surface-container-low" />
          </>
        }
      >
        {loading() ? (
          <>
            <div class="skeleton-loader elevation-1 flex h-[336px] max-w-md flex-col rounded-lg bg-surface-container-low" />
            <div class="skeleton-loader elevation-1 flex h-[336px] max-w-md flex-col rounded-lg bg-surface-container-low" />
            <div class="skeleton-loader elevation-1 flex h-[336px] max-w-md flex-col rounded-lg bg-surface-container-low" />
          </>
        ) : (
          <For each={sortedRoutes()}>
            {(route) => (
              <RouteCard route={route} sortKey={sortOption().key} />
            )}
          </For>
        )}
      </Suspense>
      <div ref={bottomRef} class="flex justify-center">
        {hasMore() && (
          <div class="skeleton-loader elevation-1 flex h-[336px] max-w-md flex-col rounded-lg bg-surface-container-low" />
        )}
      </div>
      <div>
        {!hasMore() && sortedRoutes().length === 0 && <div>No routes found</div>}
        {!hasMore() && sortedRoutes().length > 0 && <div>All routes loaded</div>}
      </div>
    </div>
  )
}

export default RouteList
