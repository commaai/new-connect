/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  createEffect,
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
import Button from '~/components/material/Button'

type Filter = {
  label: string
  sorter?: (a: RouteSegments, b: RouteSegments) => number
}
const filters: Filter[] = [
  {
    label: 'Miles',
    sorter: (a: RouteSegments, b: RouteSegments) => { 
      return (b.ui_derived?.distance || 0) - (a.ui_derived?.distance || 0)
    },
  },
  {
    label: 'Duration',
    sorter: (a: RouteSegments, b: RouteSegments) => { 
      return (b.ui_derived?.duration?.asMilliseconds() || 0) - (a.ui_derived?.duration?.asMilliseconds() || 0)
    },
  },
  {
    label: 'Engagement',
    sorter: (a: RouteSegments, b: RouteSegments) => { 
      return (b.ui_derived?.engagement || 0) - (a.ui_derived?.engagement || 0)
    },
  },
]

const PAGE_SIZE = 5
const pages: Promise<RouteSegments[]>[] = []

type Props = {
  searchQuery: string,
  dongleId: string | undefined
}

const RouteList: VoidComponent<Props> = (props) => {
  
  const dongleId = () => props.dongleId
  const query = () => props.searchQuery
  
  let routes: RouteSegments[] = []

  const [display, setDisplay] = createSignal<RouteSegments[]>([])
  const [pageSize, setSize] = createSignal<number>(0)
  const [filter, setFilter] = createSignal<Filter>({ label: '' })

  const getPage = (page: number): Promise<RouteSegments[]> => {
    if (!pages[page]) {
      // eslint-disable-next-line no-async-promise-executor
      pages[page] = new Promise(async (resolve) => {
        const previousPageData = page > 0 ? await getPage(page - 1) : undefined
        const key = getKey(dongleId(), PAGE_SIZE, previousPageData)
        const data = await getRouteCardsData(key)
        resolve(data)
      })
    }
    return pages[page]
  }

  const searchResults = (searchQuery: string | undefined) => {
    let results = routes
    if(searchQuery) {
      results = routes.filter(route => {
        const address = route.ui_derived?.address
        return address?.start.toLowerCase().includes(searchQuery) || address?.end.toLowerCase().includes(searchQuery)
      })
    }
    return results
  }

  const filteredResults = () => {
    let results = routes
    if(filter().label != '') {
      results = results.slice().sort(filter().sorter)
    }
    return results
  }

  createEffect(() => {
    getPage(pageSize())
      .then(res => {
        routes = routes.concat(res)
        routes = searchResults(query())
        routes = filteredResults()
        setDisplay(routes)
      })
      .catch(() => {})
  })

  createEffect(() => {
    setDisplay(searchResults(query()))
  })

  const Filters: VoidComponent = () => {

    return (
      <div class="flex h-40 w-full items-end space-x-4 p-4">
        <For each={filters}>
          {(each) => (
            <div
              onClick={() => {
                setFilter(each.label === filter().label ? { label: '' } : each)
                setDisplay(filteredResults())
              }}
              class={`group flex items-center justify-center rounded-lg border-2 border-secondary-container px-4 py-2 ${each.label === filter().label ? 'bg-primary-container' : 'hover:bg-secondary-container'}`}
            >
              <p class={`${each.label === filter().label ? 'text-on-primary-container' : 'text-on-secondary-container group-hover:text-primary'}`}>{each.label}</p>
            </div>
          )}
        </For>
      </div>
    )
  }

  return (
    <Suspense fallback={<div class="flex size-full items-center justify-center"><Loader /></div>} >
      <Filters /><For each={display()}>
        {(route) => <RouteCard route={route} />}
      </For>
      <Show when={display().length > 0}>
        <div class="h-20 w-full flex items-center justify-center">
          <Button onClick={() => setSize(pageSize() + 1)}>Load more</Button>
        </div>
      </Show>
      <div class="h-60 w-full sm:h-44" />
    </Suspense>
  )
}

export default RouteList
