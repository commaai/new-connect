/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  createEffect,
  createSignal,
  For,
  Suspense,
  onCleanup,
} from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'
import dayjs from 'dayjs'

import type { RouteSegments } from '~/types'

import RouteCard from '~/components/RouteCard'
import { fetcher } from '~/api'
import RouteSorter from '~/components/RouteSorter'
import { SortOption, SortKey, sortRoutes } from '~/utils/sorting'

const PAGE_SIZE = 7
const DEFAULT_DAYS = 7

type RouteListProps = {
  class?: string
  dongleId: string
}

const fetchRoutesWithinDays = async (dongleId: string, days: number): Promise<RouteSegments[]> => {
  const now = dayjs().valueOf()
  const pastDate = dayjs().subtract(days, 'day').valueOf()
  const endpoint = (end: number) => `/v1/devices/${dongleId}/routes_segments?limit=${PAGE_SIZE}&end=${end}`
  
  let allRoutes: RouteSegments[] = []
  let end = now

  while (true) {
    const key = `${endpoint(end)}`
    try {
      const routes = await fetcher<RouteSegments[]>(key)
      if (routes.length === 0) break
      allRoutes = [...allRoutes, ...routes]
      end = routes.at(-1)!.end_time_utc_millis - 1
      if (end < pastDate) break
    } catch (error) {
      console.error('Error fetching routes:', error)
      break
    }
  }
  return allRoutes.filter(route => route.end_time_utc_millis >= pastDate)
}

const RouteList: VoidComponent<RouteListProps> = (props) => {
  const [sortOption, setSortOption] = createSignal<SortOption>({ label: 'Date', key: 'date', order: 'desc' })
  const [allRoutes, setAllRoutes] = createSignal<RouteSegments[]>([])
  const [sortedRoutes, setSortedRoutes] = createSignal<RouteSegments[]>([])
  const [loading, setLoading] = createSignal(false)
  const [days, setDays] = createSignal(DEFAULT_DAYS)

  createEffect(() => {
    if (props.dongleId) {
      setLoading(true)
      fetchRoutesWithinDays(props.dongleId, days()).then(routes => {
        setAllRoutes(routes)
        setLoading(false)
      }).catch(error => {
        console.error('Error fetching routes:', error)
        setLoading(false)
      })
    }
  })

  // Effect to sort routes when allRoutes or sortOption changes
  createEffect(() => {
    const sortAndSetRoutes = async () => {
      const routes = allRoutes()
      const currentSortOption = sortOption()
      if (routes.length > 0) {
        try {
          const sorted = await sortRoutes(routes, currentSortOption)
          setSortedRoutes(sorted)
        } catch (error) {
          console.error('Error sorting routes:', error)
        }
      }
    }
    void sortAndSetRoutes()
  })

  // Handler for sort option changes
  const handleSortChange = (key: SortKey, order: 'asc' | 'desc' | null) => {
    if (order === null) {
      setSortOption({ label: 'Date', key: 'date', order: 'desc' })
    } else {
      const label = key.charAt(0).toUpperCase() + key.slice(1)
      setSortOption({ label, key, order })
    }
  }

  // Infinite scrolling observer
  let bottomRef: HTMLDivElement | undefined
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !loading()) {
        setLoading(true)
        setDays(days => days + DEFAULT_DAYS)
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
    <div
      class={clsx(
        'flex w-full flex-col justify-items-stretch gap-4',
        props.class,
      )}
    >
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
        <For each={sortedRoutes()}>
          {(route) => <RouteCard route={route} />}
        </For>
      </Suspense>
      <div ref={bottomRef} class="flex justify-center">
        {loading() && <div>Loading more...</div>}
      </div>
      <div>
        {sortedRoutes().length === 0 && !loading() && <div>No routes found</div>}
        {sortedRoutes().length > 0 && !loading() && <div>All routes loaded</div>}
      </div>
    </div>
  )
}

export default RouteList
