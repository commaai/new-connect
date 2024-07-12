import { createEffect, createResource, createSignal, For, onCleanup } from 'solid-js'
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
  // Initialize state signals
  const [sortOption, setSortOption] = createSignal<SortOption>({ label: 'Date', key: 'date', order: 'asc' })
  const [page, setPage] = createSignal(1)
  const [allRoutes, setAllRoutes] = createSignal<RouteSegments[]>([])
  const [sortedRoutes, setSortedRoutes] = createSignal<RouteSegments[]>([])
  const [hasMore, setHasMore] = createSignal(true)

  // Create a resource for fetching routes
  // ! This might refetch unnecessarily if any of the dependencies change
  const [routesData, { refetch }] = createResource(
    () => ({ dongleId: props.dongleId, page: page(), pageSize: PAGE_SIZE }),
    fetchRoutes,
  )

  // Effect to update allRoutes when new data is fetched
  createEffect(() => {
    const newRoutes = routesData()
    if (newRoutes) {
      setAllRoutes(prev => {
        // Filter out duplicate routes
        const uniqueNewRoutes = newRoutes.filter(newRoute => 
          !prev.some(existingRoute => existingRoute.start_time === newRoute.start_time),
        )
        // Update hasMore based on whether a full page was returned
        setHasMore(newRoutes.length === PAGE_SIZE)
        // Append new unique routes to existing routes
        return [...prev, ...uniqueNewRoutes]
      })
    }
  })

  // Effect to sort routes when allRoutes or sortOption changes
  createEffect(() => {
    const routes = allRoutes()
    const currentSortOption = sortOption()
    if (routes.length > 0) {
      void sortAndSetRoutes(routes, currentSortOption)
    }
  })

  // Function to sort routes and update sortedRoutes signal
  const sortAndSetRoutes = async (routes: RouteSegments[], currentSortOption: SortOption) => {
    const sorted = await sortRoutes(routes, currentSortOption)
    setSortedRoutes(sorted)
  }

  // Handler for sort option changes
  const handleSortChange = (key: SortKey, order: 'asc' | 'desc') => {
    const label = key.charAt(0).toUpperCase() + key.slice(1)
    setSortOption({ label, key, order })
    // Reset pagination and refetch routes
    setPage(1)
    setAllRoutes([])
    setHasMore(true)
    void refetch()
  }

  // Function to load more routes
  const loadMore = () => {
    console.log('loadMore called', { loading: routesData.loading, hasMore: hasMore() })
    if (!routesData.loading && hasMore()) {
      console.log('Incrementing page')
      setPage(p => p + 1)
    }
  }

  // Set up Intersection Observer for infinite scrolling
  let bottomRef: HTMLDivElement | undefined
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        console.log('Bottom of list visible')
        loadMore()
      }
    },
    { rootMargin: '200px' },
  )

  // Effect to observe/unobserve the bottom element
  createEffect(() => {
    if (bottomRef) {
      observer.observe(bottomRef)
    }
    return () => {
      if (bottomRef) observer.unobserve(bottomRef)
    }
  })

  // Effect to refetch routes when page changes
  // ! This might cause unnecessary refetches if other dependencies of routesData change
  createEffect(() => {
    page()
    void refetch()
  })

  // Cleanup function to disconnect the observer
  onCleanup(() => observer.disconnect())

  // Render the component
  return (
    <div class="flex flex-col gap-4">
      <RouteSorter onSortChange={handleSortChange} currentSort={sortOption()} />
      <For each={sortedRoutes()}>
        {(route: RouteSegments) => <RouteCard route={route} />}
      </For>
      <div>
        {routesData.loading && <div>Loading...</div>}
        {!routesData.loading && !hasMore() && sortedRoutes().length === 0 && <div>No routes found</div>}
        {!routesData.loading && !hasMore() && sortedRoutes().length > 0 && <div>All routes loaded</div>}
      </div>
      {/* Invisible element for intersection observer */}
      <div ref={bottomRef} style={{ height: '1px' }} />
    </div>
  )
}

export default RouteList
