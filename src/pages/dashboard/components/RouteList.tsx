import {
  createEffect,
  createResource,
  createSignal,
  For,
  onCleanup,
} from 'solid-js'
import type { Component } from 'solid-js'
import { RouteSegments } from '~/types'
import { SortOption, SortKey, sortRoutes } from '~/utils/sorting'
import { fetchRoutes } from '~/api/route'
import RouteCard from '~/components/RouteCard'
import RouteSorter from '~/components/RouteSorter'

const PAGE_SIZE = 10

interface RouteListProps {
  dongleId: string
}

const RouteList: Component<RouteListProps> = (props) => {
  const [sortOption, setSortOption] = createSignal<SortOption>({ label: 'Date', key: 'date', order: 'desc' })
  const [page, setPage] = createSignal(1)
  const [allRoutes, setAllRoutes] = createSignal<RouteSegments[]>([])
  const [sortedRoutes, setSortedRoutes] = createSignal<RouteSegments[]>([])

  const [routesData, { refetch }] = createResource(
    () => ({ dongleId: props.dongleId, page: page(), pageSize: PAGE_SIZE }),
    fetchRoutes,
  )

  // Effect to update allRoutes when new routesData is available
  createEffect(() => {
    const newRoutes = routesData()
    if (newRoutes) {
      setAllRoutes(prev => [...prev, ...newRoutes])
    }
  })

  // Effect to sort routes whenever allRoutes or sortOption changes
  createEffect(() => {
    const routes = allRoutes()
    const currentSortOption = sortOption()
    if (routes.length > 0) {
      void sortAndSetRoutes(routes, currentSortOption)
    }
  })

  // Function to sort and set sorted routes
  const sortAndSetRoutes = async (routes: RouteSegments[], currentSortOption: SortOption) => {
    const sorted = await sortRoutes(routes, currentSortOption)
    setSortedRoutes(sorted)
  }

  // Handle sort change without returning a promise
  const handleSortChange = (key: SortKey, order: 'asc' | 'desc') => {
    const label = key.charAt(0).toUpperCase() + key.slice(1) // Create a label from the key
    setSortOption({ label, key, order })
    setPage(1)
    setAllRoutes([])
    void refetch()
  }

  let bottomRef: HTMLDivElement | undefined
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !routesData.loading) {
        setPage(p => p + 1)
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
    <div class="flex flex-col gap-4">
      <RouteSorter onSortChange={handleSortChange} currentSort={sortOption()} />
      <For each={sortedRoutes()}>
        {(route: RouteSegments) => <RouteCard route={route} />}
      </For>
      <div ref={bottomRef}>
        {routesData.loading && <div>Loading...</div>}
      </div>
    </div>
  )
}

export default RouteList
