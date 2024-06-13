/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  createEffect,
  createResource,
  createSignal,
  For,
  createMemo,
  onCleanup,
  batch,
} from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

import type { Route } from '~/types'

import RouteCard from '~/components/RouteCard'
import { fetcher } from '~/api'
import Typography from '~/components/material/Typography'

const PAGE_SIZE = 3

type RouteListProps = {
  class?: string
  dongleId: string
}

const pages: Promise<Route[]>[] = []

const RouteList: VoidComponent<RouteListProps> = (props) => {
  const endpoint = () =>
    `/v1/devices/${props.dongleId}/routes_segments?limit=${PAGE_SIZE}`

  const getKey = (previousPageData?: Route[]): string | undefined => {
    if (!previousPageData) return endpoint()
    if (previousPageData.length === 0) return undefined
    const lastRoute = previousPageData[previousPageData.length - 1]
    const lastSegmentEndTime =
      lastRoute.segment_start_times[lastRoute.segment_start_times.length - 1]
    return `${endpoint()}&end=${lastSegmentEndTime - 1}`
  }

  const [hasMore, setHasMore] = createSignal(true)

  const getPage = async (page: number): Promise<Route[]> => {
    if (!pages[page]) {
      pages[page] = await (async () => {
        try {
          const previousPageData = page > 0 ? await getPage(page - 1) : undefined
          const key = getKey(previousPageData)
          const routes = key ? await fetcher<Route[]>(key) : []
          if (routes.length < PAGE_SIZE) {
            setHasMore(false)
          }
          return routes
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.error('Error fetching page:', error.message);
          } else {
            console.error('Error fetching page:', error);
          }
  
          return [] as Route[]
        }
      })()
    }
    return pages[page]
  }

  createEffect(() => {
    if (props.dongleId) {
      pages.length = 0
      setSize(1)
      let refetch: () => Promise<any>;
      refetch().catch((error: unknown) => {
        if (error instanceof Error) {
          console.error('Error refetching:', error.message);
        } else {
          console.error('Error refetching:', error);
        }
      });
    }
  })

  const [size, setSize] = createSignal(0)
  const pageNumbers = () => Array.from(Array(size()).keys())

  let bottomRef!: HTMLDivElement
  createEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        batch(() => {
          setSize(size() + 1)
          // Refetch and sort when new pages are loaded
          let refetch: () => Promise<any>;
          refetch().catch((error: unknown) => {
            if (error instanceof Error) {
              console.error('Error refetching:', error.message);
            } else {
              console.error('Error refetching:', error);
            }
          });
        })
      }
    })

    observer.observe(bottomRef)

    onCleanup(() => {
      observer.disconnect()
    })
  })

  const loadingOrEndMessage = createMemo(() => (hasMore() ? 'loading...' : 'No more routes'))

  const [currentFilter, setCurrentFilter] = createSignal('date')

  // Helper function for sorting routes based on filter
  const sortRoutes = (routes: Route[]): Route[] => {
    switch (currentFilter()) {
      case 'date':
        return routes.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
      case 'miles':
        return routes.slice().sort((a, b) => (b.length || 0) - (a.length || 0))
      case 'duration':
        return routes.slice().sort((a, b) => {
          const aDuration = new Date(a.end_time).getTime() - new Date(a.start_time).getTime()
          const bDuration = new Date(b.end_time).getTime() - new Date(b.start_time).getTime()
          return bDuration - aDuration
        })
      default:
        return routes.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    }
  }

  // Fetch all pages and sort outside the For loop
  const [allRoutes = [], { refetch }] = createResource(
    [],
    async () => {
      try {
        const pages = await Promise.all(pageNumbers().map(getPage))
        const routes = pages.flat()

        if (routes && routes.length > 0) {
          return sortRoutes(routes)
        } else {
          return []
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('Error fetching page:', error.message);
        } else {
          console.error('Error fetching page:', error);
        }

        return []
      }
    }
  )

  // manage the sorted routes
  const [sortedRoutes, setSortedRoutes] = createSignal<Route[]>([])

  // update sortedRoutes whenever allRoutes changes
  createEffect(() => {
    try {
      const newRoutesResult = allRoutes();
      if (newRoutesResult instanceof Error) {
        throw newRoutesResult;
      }
      const newRoutes: Route[] = newRoutesResult;
      setSortedRoutes((prevRoutes: Route[]) => {
        const combinedRoutes: Route[] = [...prevRoutes, ...newRoutes];
        return sortRoutes(combinedRoutes);
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching all routes:', error.message);
      } else {
        console.error('Error fetching all routes:', error);
      }
    }
  });

  return (
    <div
      class={clsx(
        'flex w-full h-full flex-col',
        props.class
      )}
      style={{ height: 'calc(100vh - 72px - 5rem)' }}
    >
      <div class='flex gap-5 w-full h-[45px] overflow-y-hidden overflow-x-auto hide-scrollbar'>
        <Typography variant='label-sm' class='my-auto pb-3'>Sort by:</Typography>
        <div
          class={`filter-custom-btn ${currentFilter() === 'date' ? 'selected-filter-custom-btn' : ''}`}
          onClick={() => setCurrentFilter('date')}
        >
          Date
        </div>
        <div
          class={`filter-custom-btn ${currentFilter() === 'miles' ? 'selected-filter-custom-btn' : ''}`}
          onClick={() => setCurrentFilter('miles')}
        >
          Miles
        </div>
        <div
          class={`filter-custom-btn ${currentFilter() === 'duration' ? 'selected-filter-custom-btn' : ''}`}
          onClick={() => setCurrentFilter('duration')}
        >
          Duration
        </div>
      </div>
      <div class="flex flex-col w-full h-full gap-4 overflow-y-auto hide-scrollbar lg:custom-scrollbar">
        <For each={sortedRoutes()}>
          {(route: Route) => <RouteCard route={route} />}
        </For>
        <div ref={bottomRef} class='flex justify-center w-[735px] mb-3'>
          <Typography>{loadingOrEndMessage()}</Typography>
        </div>
      </div>
    </div>
  )
}

export default RouteList