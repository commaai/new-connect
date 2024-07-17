/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  createEffect,
  createResource,
  createSignal,
  For,
  Suspense,
} from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

import type { RouteSegments } from '~/types'

import RouteCard from '~/components/RouteCard'
import { fetcher } from '~/api'
import Button from '~/components/material/Button'
import RouteSorter from '~/components/RouteSorter'
import { SortOption, SortKey, sortRoutes } from '~/utils/sorting'

const PAGE_SIZE = 3

type RouteListProps = {
  class?: string
  dongleId: string
}

const pages: Promise<RouteSegments[]>[] = []

const RouteList: VoidComponent<RouteListProps> = (props) => {
  const [sortOption, setSortOption] = createSignal<SortOption>({ label: 'Date', key: 'date', order: 'desc' })
  const [allRoutes, setAllRoutes] = createSignal<RouteSegments[]>([])
  const [sortedRoutes, setSortedRoutes] = createSignal<RouteSegments[]>([])
  const [size, setSize] = createSignal(1)

  const endpoint = () => `/v1/devices/${props.dongleId}/routes_segments?limit=${PAGE_SIZE}`
  const getKey = (previousPageData?: RouteSegments[]): string | undefined => {
    if (!previousPageData) return endpoint()
    if (previousPageData.length === 0) return undefined
    const lastSegmentEndTime = previousPageData.at(-1)!.end_time_utc_millis
    return `${endpoint()}&end=${lastSegmentEndTime - 1}`
  }
  const getPage = (page: number): Promise<RouteSegments[]> => {
    if (!pages[page]) {
      // eslint-disable-next-line no-async-promise-executor
      pages[page] = new Promise(async (resolve) => {
        const previousPageData = page > 0 ? await getPage(page - 1) : undefined
        const key = getKey(previousPageData)
        resolve(key ? fetcher<RouteSegments[]>(key) : [])
      })
    }
    return pages[page]
  }

  createEffect(() => {
    if (props.dongleId) {
      pages.length = 0
      setSize(1)
      setAllRoutes([])
    }
  })

  const onLoadMore = () => setSize(size() + 1)
  const pageNumbers = () => Array.from(Array(size()).keys())

  // Effect to update allRoutes when new data is fetched
  createEffect(() => {
    const fetchData = async () => {
      const newRoutes: RouteSegments[] = []
      for (const i of pageNumbers()) {
        const routes = await getPage(i)
        newRoutes.push(...routes)
      }
      if (newRoutes.length > 0) {
        setAllRoutes(newRoutes)
      }
    }
    void fetchData()
  })

  // Effect to sort routes when allRoutes or sortOption changes
  createEffect(() => {
    const sortAndSetRoutes = async () => {
      const routes = allRoutes()
      const currentSortOption = sortOption()
      if (routes.length > 0) {
        const sorted = await sortRoutes(routes, currentSortOption)
        setSortedRoutes(sorted)
      }
    }
    void sortAndSetRoutes()
  })

  // Handler for sort option changes
  const handleSortChange = (key: SortKey, order: 'asc' | 'desc') => {
    const label = key.charAt(0).toUpperCase() + key.slice(1)
    setSortOption({ label, key, order })
    // Reset allRoutes and refetch sorted routes
    setAllRoutes([])
    setSize(1)
  }

  return (
    <div
      class={clsx(
        'flex w-full flex-col justify-items-stretch gap-4',
        props.class,
      )}
    >
      <RouteSorter onSortChange={handleSortChange} currentSort={sortOption()} />
      <For each={pageNumbers()}>
        {(i) => {
          const [routes] = createResource(() => i, getPage)
          return (
            <Suspense
              fallback={
                <>
                  <div class="skeleton-loader elevation-1 flex h-[336px] max-w-md flex-col rounded-lg bg-surface-container-low" />
                  <div class="skeleton-loader elevation-1 flex h-[336px] max-w-md flex-col rounded-lg bg-surface-container-low" />
                  <div class="skeleton-loader elevation-1 flex h-[336px] max-w-md flex-col rounded-lg bg-surface-container-low" />
                </>
              }
            >
              <For each={routes()}>
                {(route) => <RouteCard route={route} />}
              </For>
            </Suspense>
          )
        }}
      </For>
      <div class="flex justify-center">
        <Button onClick={onLoadMore}>Load more</Button>
      </div>
      <div>
        {sortedRoutes().length === 0 && <div>No routes found</div>}
        {sortedRoutes().length > 0 && <div>All routes loaded</div>}
      </div>
    </div>
  )
}

export default RouteList
