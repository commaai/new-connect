/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  createEffect,
  createSignal,
  For,
  createMemo,
  onCleanup,
  onMount,
} from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

import type { Route } from '~/types'

import RouteCard from '~/components/RouteCard'
import { fetcher } from '~/api'
import Typography from '~/components/material/Typography'

const PAGE_SIZE = 6;

type RouteListProps = {
  class?: string
  dongleId: string
}

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

  const [hasMore, setHasMore] = createSignal(true);
  const [isLoading, setIsLoading] = createSignal(false);
  const [routes, setRoutes] = createSignal<Route[]>([]);

  // Signal to force re-render
  const [forceUpdate, setForceUpdate] = createSignal(false);

  const updateVirtualizerSize = () => {
    if (virtualizerInstance && virtualizerInstance.ref) {
      virtualizerInstance.updateSize(sortRoutes(routes()).length);
    }
  };

  interface Virtualizer {
    size: number;
    ref?: HTMLElement;
    updateSize: (size: number) => void;
  }
  
  const virtualizerInstance: Virtualizer = {
    size: 0,
    ref: undefined,
    updateSize: (size: number) => { 
      virtualizerInstance.size = size; 
    },
  };

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
          const aDuration = new Date(b.end_time).getTime() - new Date(b.start_time).getTime()
          const bDuration = new Date(b.end_time).getTime() - new Date(b.start_time).getTime()
          return bDuration - aDuration
        })
      default:
        return routes.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    }
  }

  const virtual = createMemo(() => {
    virtualizerInstance.overscan = 10;
    return virtualizerInstance;
  });

  const fetchMore = async () => {
    setIsLoading(true);
    try {
      const previousPageData = routes();
      const key = getKey(previousPageData);
      const newRoutes = key ? await fetcher<Route[]>(key) : [];

      if (newRoutes.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setRoutes((prevRoutes) => [...prevRoutes, ...newRoutes]);
      updateVirtualizerSize();
      setForceUpdate(!forceUpdate()); // Trigger re-render
    } catch (error) {
      console.error('Error fetching more routes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to handle scroll and fetch more data
  createEffect(() => {
    let container: HTMLElement | null = null;
    let scrollListener: EventListener | null = null;

    onMount(() => {
      container = virtual().ref?.parentElement;

      if (container) {
        scrollListener = () => {
          if (
            container.scrollTop + container.clientHeight >=
            container.scrollHeight - 50 &&
            hasMore() &&
            !isLoading()
          ) {
            fetchMore().catch(error => console.error('Error in fetchMore:', error));
          }
        };
        container.addEventListener('scroll', scrollListener);
      }
    });

    onCleanup(() => {
      if (scrollListener && container) {
        container.removeEventListener('scroll', scrollListener);
      }
    });
  });

  onMount(async () => {
    try {
      const initialRoutes = await fetcher<Route[]>(endpoint());
      setRoutes(initialRoutes);
    } catch (error) {
      console.error('Error fetching initial routes:', error);
    }
  });

  return (
    <div
      class={clsx(
        'flex size-full flex-col',
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
      <div class="flex flex-col size-full overflow-y-auto hide-scrollbar lg:custom-scrollbar">
        <div ref={virtual().ref} class='flex flex-col gap-4 size-full'>
          <For each={sortRoutes(routes())}>
            {(route) => (
              <div>
                <RouteCard route={route} />
              </div>
            )}
          </For>

          {/* Filler element to push messages to the bottom */}
          <div style={{ height: '1px' }} />
          {isLoading() && <Typography variant="label-md" class='pb-8'>Loading...</Typography>}
          {!hasMore() && !isLoading() && <Typography variant="label-md" class='pb-8'>No More Routes</Typography>}
        </div>
      </div>
    </div>
  )
}

export default RouteList