/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  createEffect,
  createResource,
  createSignal,
  For,
  Suspense,
  onCleanup
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

  const [hasMore, setHasMore] = createSignal(true); // Add this line

  const getPage = (page: number): Promise<Route[]> => {
    if (!pages[page]) {
      pages[page] = (async () => {
        const previousPageData = page > 0 ? await getPage(page - 1) : undefined
        const key = getKey(previousPageData)
        const routes = key ? await fetcher<Route[]>(key) : []
        if (routes.length < PAGE_SIZE) {
          setHasMore(false); // Set hasMore to false when there are no more routes
        }
        return routes
      })()
    }
    return pages[page]
  }

  createEffect(() => {
    if (props.dongleId) {
      pages.length = 0
      setSize(1)
    }
  })

  const [size, setSize] = createSignal(0)
  const pageNumbers = () => Array.from(Array(size()).keys())

  let bottomRef!: HTMLDivElement;
  createEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setSize(size() + 1);
      }
    });

    observer.observe(bottomRef);

    onCleanup(() => {
      observer.disconnect();
    });
  });

  const loadingOrEndMessage = hasMore() ? 'loading...' : 'No more routes';

  return (
    <div
      class={clsx(
        'flex w-full h-full flex-col',
        props.class,
      )} style={{ height: 'calc(100vh - 72px - 5rem)' }}
    >
      <div class='flex gap-5 w-full h-[45px] overflow-y-hidden overflow-x-auto hide-scrollbar'>
        <div class='filter-custom-btn selected-filter-custom-btn'>
          Date
        </div>
        <div class='filter-custom-btn'>
          Miles
        </div>
        <div class='filter-custom-btn'>
          Duration
        </div>
        <div class='filter-custom-btn'>
          % Engaged
        </div>
        <div class='filter-custom-btn'>
          User Flags
        </div>
      </div>
      <div class="flex flex-col w-full h-full gap-4 overflow-y-auto hide-scrollbar lg:custom-scrollbar">
        <For each={pageNumbers()}>
          {(i) => {
            const [routes] = createResource(() => i, getPage)
            return (
              <Suspense
                fallback={
                  <div class="skeleton-loader size-full bg-surface" />
                }
              >
                <For each={routes()}>
                  {(route) => <RouteCard route={route} />}
                </For>
              </Suspense>
            )
          }}
        </For>
        <div ref={bottomRef} class='flex justify-center w-[735px] mb-3'>
          <Typography>{loadingOrEndMessage}</Typography>
        </div>
      </div>
    </div>
  )
}

export default RouteList
