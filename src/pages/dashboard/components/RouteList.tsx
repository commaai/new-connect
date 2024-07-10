import {
  createEffect,
  createResource,
  createSignal,
  For,
  onCleanup,
} from 'solid-js'
import type { Component } from 'solid-js'
import { RouteSegments } from '~/types'
import { SortOption, sortRoutes } from '~/utils/sorting'
import { fetchRoutes } from '~/api/route'
import RouteCard from '~/components/RouteCard'
import RouteSorter from '~/components/RouteSorter'

const PAGE_SIZE = 10

interface RouteListProps {
  dongleId: string
}

const RouteList: Component<RouteListProps> = (props) => {
  const [sortOption, setSortOption] = createSignal<SortOption>({ key: 'date', order: 'desc' })
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
      setAllRoutes(prev => [...prev, ...newRoutes])
    }
  })

  createEffect(async () => {
    const routes = allRoutes()
    if (routes.length > 0) {
      const sorted = await sortRoutes(routes, sortOption())
      setSortedRoutes(sorted)
    }
  })

  // ! Fix this
  const handleSortChange = (key: string, order: 'asc' | 'desc' | null) => {
    setSortOption({ key, order: order || 'desc' })
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
      <RouteSorter onSortChange={handleSortChange} />
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
