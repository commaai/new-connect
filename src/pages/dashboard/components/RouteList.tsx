/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  createEffect,
  createMemo,
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

const PAGE_SIZE = 3

type RouteListProps = {
  class?: string
  dongleId: string
}

const pages: Promise<RouteSegments[]>[] = []

const RouteList: VoidComponent<RouteListProps> = (props) => {
  const endpoint = () => `/v1/devices/${props.dongleId}/routes_segments?limit=${PAGE_SIZE}`
  const getKey = (previousPageData?: RouteSegments[]): string | undefined => {
    if (!previousPageData) return endpoint()
    if (previousPageData.length === 0) return undefined
    // if route has no end time, fall back to create_time
    const lastSegmentEndTime = 
      previousPageData.at(-1)!.end_time_utc_millis ?? previousPageData.at(-1)!.create_time
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
    }
  })

  const [size, setSize] = createSignal(1)
  const onLoadMore = () => setSize(size() + 1)
  const pageNumbers = () => Array.from(Array(size()).keys())

  return (
    <div
      class={clsx(
        'flex w-full flex-col justify-items-stretch gap-4',
        props.class,
      )}
    >
      <For each={pageNumbers()}>
        {(i) => {
          const [routes] = createResource(() => i, getPage)
          const sortedRoutes = createMemo(() => {
            const currentRoutes = routes() ?? []
            // if route doesn't have start time, fall back to create_time
            return currentRoutes.sort((a, b) => {
              const startTimeA = a.start_time_utc_millis ?? a.create_time * 1000
              const startTimeB = b.start_time_utc_millis ?? b.create_time * 1000
              return startTimeB - startTimeA
            })
          })
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
              <For each={sortedRoutes()}>
                {(route) => <RouteCard route={route} />}
              </For>
            </Suspense>
          )
        }}
      </For>
      <div class="flex justify-center">
        <Button onClick={onLoadMore}>Load more</Button>
      </div>
    </div>
  )
}

export default RouteList
