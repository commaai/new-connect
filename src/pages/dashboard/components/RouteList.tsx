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
  const [sortOption, setSortOption] = createSignal<SortOption>({ label: 'Date', key: 'date', order: 'desc' })
  const [page, setPage] = createSignal(1)
  const [allRoutes, setAllRoutes] = createSignal<RouteSegments[]>([])
  const [sortedRoutes, setSortedRoutes] = createSignal<RouteSegments[]>([])

  const [routesData, { refetch }] = createResource(
    () => ({ dongleId: props.dongleId, page: page(), pageSize: PAGE_SIZE }),
    fetchRoutes,
  )

  createEffect(() => {
    const newRoutes = routesData()
    if (newRoutes) {
      setAllRoutes(prev => {
        const uniqueNewRoutes = newRoutes.filter(newRoute => 
          !prev.some(existingRoute => existingRoute.start_time === newRoute.start_time),
        )
        return [...prev, ...uniqueNewRoutes]
      })
    }
  })

  createEffect(() => {
    const routes = allRoutes()
    const currentSortOption = sortOption()
    console.log('Current all routes:', routes.map(r => ({ 
      start_time: r.start_time_utc_millis, 
      duration: r.duration,
      miles: r.length,
      engaged: r.engagedDuration,
      userFlags: r.userFlags,
    })))
    console.log('Current sort option:', currentSortOption)
    if (routes.length > 0) {
      void sortAndSetRoutes(routes, currentSortOption)
    }
  })

  const sortAndSetRoutes = async (routes: RouteSegments[], currentSortOption: SortOption) => {
    console.log('Sorting with option:', currentSortOption)
    const sorted = await sortRoutes(routes, currentSortOption)
    console.log('Sorted routes before setting state:', sorted.map(r => ({ 
      start_time: r.start_time_utc_millis, 
      duration: r.duration,
      miles: r.length,
      engaged: r.engagedDuration,
      userFlags: r.userFlags,
    })))
    setSortedRoutes(sorted)
    console.log('Routes after setting state:', sortedRoutes().map(r => ({ 
      start_time: r.start_time_utc_millis, 
      duration: r.duration,
      miles: r.length,
      engaged: r.engagedDuration,
      userFlags: r.userFlags,
    })))
  }

  const handleSortChange = (key: SortKey, order: 'asc' | 'desc') => {
    const label = key.charAt(0).toUpperCase() + key.slice(1)
    setSortOption({ label, key, order })
    setPage(1)
    void refetch()
  }

  // Add this effect to log sorted routes whenever they change
  createEffect(() => {
    console.log('Routes at render:', sortedRoutes().map(r => ({ start_time: r.start_time_utc_millis, create_time: r.create_time })))
  })

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
