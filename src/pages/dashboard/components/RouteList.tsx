/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  createEffect,
  createSignal,
  For,
  Suspense,
  on,
} from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

import type { RouteSegments } from '~/types'

import RouteCard from '~/components/RouteCard'
import { fetcher } from '~/api'
import Button from '~/components/material/Button'

const PAGE_SIZE = 3

type RouteListProps = {
  class?: string
  dongleId: string
}

const RouteList: VoidComponent<RouteListProps> = (props) => {
  const endpoint = () =>
    `/v1/devices/${props.dongleId}/routes_segments?limit=${PAGE_SIZE}`
  
  const getKey = (previousPageData?: RouteSegments[]): string | undefined => {
    if (!previousPageData) return endpoint()
    if (previousPageData.length === 0) return undefined

    const lastSegmentEndTime =
      previousPageData.at(-1)!.end_time_utc_millis ??
      previousPageData.at(-1)!.create_time
    return `${endpoint()}&end=${lastSegmentEndTime - 1}`
  }

  const [pages, setPages] = createSignal<RouteSegments[][]>([])
  const [size, setSize] = createSignal(1)
  const [sortedRoutes, setSortedRoutes] = createSignal<RouteSegments[]>([])
  const [error, setError] = createSignal<string | null>(null)

  const sortByCreateTime = (routes: RouteSegments[]) =>
    [...routes].sort((a, b) => {
      const startTimeA = a.start_time_utc_millis ?? a.create_time * 1000
      const startTimeB = b.start_time_utc_millis ?? b.create_time * 1000
      return startTimeB - startTimeA
    })

  const getPage = async (page: number): Promise<RouteSegments[]> => {
    if (!pages()[page]) {
      const previousPageData = page > 0 ? pages()[page - 1] : undefined
      const key = getKey(previousPageData)
      if (key) {
        try {
          const newPageData = await fetcher<RouteSegments[]>(key)
          const newPages = [...pages(), newPageData]
          setPages(newPages)
          return newPageData
        } catch (err) {
          console.error('Failed to fetch page data:', err)
          setError('Failed to load route segments. Please try again.')
          return []
        }
      } else {
        return []
      }
    }
    return pages()[page]
  }

  const onLoadMore = async () => {
    try {
      const nextPageData = await getPage(size())
      setSize(size() + 1)
      setSortedRoutes((prev) => sortByCreateTime([...prev, ...nextPageData]))
    } catch (err) {
      console.error('Error loading more routes:', err)
      setError('An error occurred while loading more routes.')
    }
  }

  const fetchInitialData = async () => {
    try {
      const initialData = sortByCreateTime(await getPage(0))
      setSortedRoutes(initialData)
    } catch (err) {
      console.error('Error fetching initial data:', err)
      setError('Failed to load routes. Please refresh the page.')
    }
  }

  createEffect(on(() => props.dongleId, (dongleId) => {
    if (dongleId) {
      setPages([])
      setSize(1)
      setSortedRoutes([])
      setError(null)
      void fetchInitialData()
    }
  }))

  return (
    <div class={clsx('flex w-full flex-col gap-4', props.class)}>
      {error() && (
        <div class="rounded bg-red-100 p-4 text-red-500">{error()}</div>
      )}

      <div class="mb-8 flex flex-col flex-wrap items-center justify-center gap-4 md:flex-row">
        <For each={Array.from({ length: size() }, (_, i) => i)}>
          {(_i) => (
            <Suspense
              fallback={
                <div class="skeleton-loader elevation-1 flex h-[336px] max-w-md flex-col rounded-lg bg-surface-container-low" />
              }
            >
              <For each={sortedRoutes()}>
                {(route) => <RouteCard route={route} />}
              </For>
            </Suspense>
          )}
        </For>
      </div>

      <div class="flex justify-center">
        <Button onClick={onLoadMore} disabled={!!error()}>
          Load more
        </Button>
      </div>
    </div>
  )
}

export default RouteList
