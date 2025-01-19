import {
  createEffect,
  createResource,
  createSignal,
  For,
  Suspense,
  onCleanup,
  onMount,
  Index,
  type VoidComponent,
} from 'solid-js'
import { clsx } from 'clsx'
import type { RouteSegments } from '~/types'
import RouteCard from '~/components/RouteCard'
import { fetcher } from '~/api'

const PAGE_SIZE = 3

interface RouteListProps {
  class?: string
  dongleId: string
}

const pages: Promise<RouteSegments[]>[] = []

const RouteList: VoidComponent<RouteListProps> = (props) => {
  const endpoint = () => `/v1/devices/${props.dongleId}/routes_segments?limit=${PAGE_SIZE}`
  const getKey = (previousPageData?: RouteSegments[]): string | undefined => {
    if (!previousPageData) return endpoint()
    if (previousPageData.length === 0) return undefined
    const lastSegmentEndTime = previousPageData.at(-1)!.end_time_utc_millis
    return `${endpoint()}&end=${lastSegmentEndTime - 1}`
  }
  const getPage = (page: number): Promise<RouteSegments[]> => {
    if (pages[page] === undefined) {
      pages[page] = (async () => {
        const previousPageData = page > 0 ? await getPage(page - 1) : undefined
        const key = getKey(previousPageData)
        return key ? fetcher<RouteSegments[]>(key) : []
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

  const [size, setSize] = createSignal(1)
  const pageNumbers = () => Array.from({ length: size() })

  const [sentinel, setSentinel] = createSignal<HTMLDivElement | undefined>()
  let observer: IntersectionObserver | undefined

  onMount(() => {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setSize((prev) => prev + 1)
        }
      },
      { threshold: 0.1 },
    )

    const sentinelEl = sentinel()
    if (sentinelEl) {
      observer.observe(sentinelEl)
    }
  })

  onCleanup(() => observer?.disconnect())

  const LoadingSkeleton = () => (
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Index each={Array(PAGE_SIZE)}>
        {() => (
          <div
            class="skeleton-loader elevation-1 flex h-[336px] flex-col rounded-lg bg-surface-container-low"
          />
        )}
      </Index>
    </div>
  )

  return (
    <div class={clsx(
      'w-full p-4 md:p-6',
      'mx-auto max-w-7xl',
      props.class,
    )}>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        <For each={pageNumbers()}>
          {(_, i) => {
            const [routes] = createResource(() => i(), getPage)
            return (
              <Suspense fallback={<LoadingSkeleton />}>
                <For each={routes()}>
                  {(route) => (
                    <div class="w-full">
                      <RouteCard route={route} />
                    </div>
                  )}
                </For>
              </Suspense>
            )
          }}
        </For>
      </div>
      <div ref={setSentinel} class="h-10 w-full" />
    </div>
  )
}

export default RouteList
