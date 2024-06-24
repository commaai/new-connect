/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  createEffect,
  createResource,
  createSignal,
  For,
  Show,
  Suspense,
} from 'solid-js'
import type { VoidComponent } from 'solid-js'
import type { RouteSegments } from '~/types'
import { getKey, getRouteCardsData } from '~/api/routelist'
import RouteCard from '~/components/RouteCard'
import Loader from '~/components/Loader'

const PAGE_SIZE = 5
const pages: Promise<RouteSegments[]>[] = []

type Props = {
  searchQuery: string,
  dongleId: string | undefined
}

const RouteList: VoidComponent<Props> = (props) => {
  
  const [searchResults, setSearchResults] = createSignal<RouteSegments[]>([])

  const dongleId = () => props.dongleId
  const query = () => props.searchQuery
  let cache: RouteSegments[] = []

  const getPage = (page: number): Promise<RouteSegments[]> => {
    if (!pages[page]) {
      // eslint-disable-next-line no-async-promise-executor
      pages[page] = new Promise(async (resolve) => {
        const previousPageData = page > 0 ? await getPage(page - 1) : undefined
        const key = getKey(dongleId(), PAGE_SIZE, previousPageData)
        const data = await getRouteCardsData(key)
        cache = data
        resolve(data)
      })
    }
    return pages[page]
  }

  createEffect(() => {
    if (dongleId()) {
      pages.length = 0
      setSize(1)
    }
  })

  createEffect(() => {
    if (query()) {
      const results = cache.filter(route => {
        const address = route.ui_derived?.address
        return address?.start.toLowerCase().includes(query()) || address?.end.toLowerCase().includes(query())
      })
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  })

  const [size, setSize] = createSignal(1)
  const pageNumbers = () => Array.from(Array(size()).keys())

  const Filters: VoidComponent = () => {
    const [selected, setSelected] = createSignal('')

    const filters = ['miles', 'duration', 'engaged']
    return (
      <div class="flex h-40 w-full items-end space-x-4 p-4">
        <For each={filters}>
          {(filter) => (
            <div
              onClick={() => setSelected(filter === selected() ? '' : filter)}
              class={`group flex items-center justify-center rounded-lg border-2 border-secondary-container px-4 py-2 ${selected() === filter ? 'bg-primary-container' : 'hover:bg-secondary-container'}`}
            >
              <p class={`${selected() === filter ? 'text-on-primary-container' : 'text-on-secondary-container group-hover:text-primary'}`}>{filter}</p>
            </div>
          )}
        </For>
      </div>
    )
  }

  return (
    <Show when={searchResults().length <= 0} fallback={
      <>
        <Filters />
        <For each={searchResults()}>
          {(route) => <RouteCard route={route} />}
        </For>
        <div class="h-60 w-full sm:h-44" />
      </>
    }>
      <For each={pageNumbers()}>
        {(i) => {
          const [routes] = createResource(() => i, getPage)
          return (
            <Suspense fallback={<div class="flex size-full items-center justify-center"><Loader /></div>}>
              <Filters />
              <For each={routes()}>
                {(route) => <RouteCard route={route} />}
              </For>
              <div class="h-60 w-full sm:h-44" />
            </Suspense>
          )
        }}
      </For>
    </Show>
  )
}

export default RouteList
