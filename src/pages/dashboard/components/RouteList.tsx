import {
  createEffect,
  createResource,
  createSignal,
  For,
  Suspense,
} from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

import type { Route } from '~/types'

import RouteCard from '~/components/RouteCard'
import { fetcher } from '~/api'
import Button from '~/components/material/Button'

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
  const getPage = (page: number): Promise<Route[]> => {
    if (!pages[page]) {
      // eslint-disable-next-line no-async-promise-executor
      pages[page] = new Promise(async (resolve) => {
        const previousPageData = page > 0 ? await getPage(page - 1) : undefined
        const key = getKey(previousPageData)
        resolve(key ? fetcher<Route[]>(key) : [])
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
          return (
            <Suspense
              fallback={
                <>
                  <div class="skeleton-loader elevation-1 flex h-[336px] max-w-md flex-col rounded-lg bg-surface-1" />
                  <div class="skeleton-loader elevation-1 flex h-[336px] max-w-md flex-col rounded-lg bg-surface-1" />
                  <div class="skeleton-loader elevation-1 flex h-[336px] max-w-md flex-col rounded-lg bg-surface-1" />
                </>
              }
            >
              <For each={routes()}>
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
