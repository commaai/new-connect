import { createEffect, createResource, createSignal, For, Index, onCleanup, onMount, Show, Suspense, type VoidComponent } from 'solid-js'
import dayjs from 'dayjs'

import { fetcher } from '~/api'
import { getTimelineStatistics } from '~/api/derived'
import Card, { CardContent, CardHeader } from '~/components/material/Card'
import Icon from '~/components/material/Icon'
import RouteStatistics from '~/components/RouteStatistics'
import { getPlaceName } from '~/map/geocode'
import type { RouteSegments } from '~/types'

function groupRoutes(all_routes: RouteSegments[] | undefined): { day: string; segments: RouteSegments[] }[] {
  if (!all_routes) return []
  const groups = new Map<string, RouteSegments[]>()
  for (const route of all_routes) {
    const day = dayjs(route.start_time_utc_millis).format('ddd, MMM D, YYYY')
    if (!groups.has(day)) {
      console.log("adding day", day)
      groups.set(day, [])
    }
    groups.get(day)!.push(route)
  }
  return Array.from(groups, ([day, segments]) => ({ day, segments }))
}

interface RouteCardProps {
  route: RouteSegments
}

const RouteCard: VoidComponent<RouteCardProps> = (props) => {
  const startTime = () => dayjs(props.route.start_time_utc_millis)
  const endTime = () => dayjs(props.route.end_time_utc_millis)
  const startPosition = () => [props.route.start_lng || 0, props.route.start_lat || 0] as number[]
  const endPosition = () => [props.route.end_lng || 0, props.route.end_lat || 0] as number[]
  const [startPlace] = createResource(startPosition, getPlaceName)
  const [endPlace] = createResource(endPosition, getPlaceName)
  const [timeline] = createResource(() => props.route, getTimelineStatistics)
  const [location] = createResource(
    () => [startPlace(), endPlace()],
    ([startPlace, endPlace]) => {
      if (!startPlace && !endPlace) return ''
      if (!endPlace || startPlace === endPlace) return startPlace
      if (!startPlace) return endPlace
      return `${startPlace} to ${endPlace}`
    },
  )

  return (
    <Card class="max-w-none" href={`/${props.route.dongle_id}/${props.route.fullname.slice(17)}`} activeClass="md:before:bg-primary">
      <CardHeader
        headline={
          <span>
            {startTime().format('h:mm A')} to {endTime().format('h:mm A')}
          </span>
        }
        subhead={location()}
        trailing={
          <Suspense>
            <Show when={timeline()?.userFlags}>
              <div class="flex items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-900 p-2 border border-amber-300 shadow-inner shadow-black/20">
                <Icon class="text-yellow-300" size="20" name="flag" filled />
              </div>
            </Show>
          </Suspense>
        }
      />

      <CardContent>
        <RouteStatistics route={props.route} />
      </CardContent>
    </Card>
  )
}

const PAGE_SIZE = 2

const RouteList: VoidComponent<{ dongleId: string }> = (props) => {
  const endpoint = () => `/v1/devices/${props.dongleId}/routes_segments?limit=${PAGE_SIZE}`
  const getKey = (previousPageData?: RouteSegments[]): string | undefined => {
    if (!previousPageData) return endpoint()
    if (previousPageData.length === 0) return undefined
    return `${endpoint()}&end=${previousPageData.at(-1)!.start_time_utc_millis - 1}`
  }
  const getPage = (page: number): Promise<RouteSegments[]> => {
    console.log('getPage', page)
    // const day = dayjs(route.start_time_utc_millis).format('ddd, MMM D, YYYY')
    // const day = 'Day 1 2025'  // TODO remove this
    // if (!days.has(day)) {
    //   days.set(day, [])
    // }
    if (!daysNew.has(page)) {
      daysNew.set(page, [])
      console.log("adding empty day list", page)
    }

    const promise = (async () => {
      const previousPageData = page > 0 ? await getPage(page - 1) : undefined
      const key = getKey(previousPageData)
      return key ? fetcher<RouteSegments[]>(key) : []
    })();

    promise.then((data) => {  // rename routes
      console.log("got data", data)
      for (const route of data) {
        const day = dayjs(route.start_time_utc_millis).format('ddd, MMM D, YYYY')
        if (!dayIdxMap.has(day)) {
          dayIdxMap.set(day, dayIdxMap.size)
          console.log("adding dayIdxMap", dayIdxMap)
        }
        const dayIdx = dayIdxMap.get(day)!
        // if (!daysNew.has(dayIdx)) {
        //   console.log("adding day123", day)
        //   daysNew.set(dayIdx, [])
        // }
        daysNew.get(dayIdx)!.push(route)
        console.log('daysNew', daysNew)
      }
    })

    // days.get(day)!.push(promise)

    // if (pages[page] === undefined) {
    //   pages[page] = (async () => {
    //     const previousPageData = page > 0 ? await getPage(page - 1) : undefined
    //     const key = getKey(previousPageData)
    //     return key ? fetcher<RouteSegments[]>(key) : []
    //   })()
    // }
    // return Promise.all([pages[page]]).then(results => results.flat());
    // return Promise.all(days.get(day)).then(results => results.flat());
    console.log("returning", daysNew.get(page))
    return daysNew.get(page)
  }

  let dayIdxMap = new Map<string, number>()

  const days = new Map<string, Promise<RouteSegments[]>[]>()
  const daysNew = new Map<number, Promise<RouteSegments[]>[]>()
  // const daysNew: Promise<RouteSegments[]>[][] = [];

  const pages: Promise<RouteSegments[]>[][] = [];
  const [size, setSize] = createSignal(1)
  const pageNumbers = () => Array.from({ length: size() })

  createEffect(() => {
    if (props.dongleId) {
      pages.length = 0
      getPage(0)
      // setSize(1)
    }
  })

  const [sentinel, setSentinel] = createSignal<HTMLDivElement>()
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        setSize((prev) => prev + 1)
        getPage(0)
      }
    },
    { threshold: 0.1 },
  )
  onMount(() => {
    const sentinelEl = sentinel()
    if (sentinelEl) {
      observer.observe(sentinelEl)
    }
  })
  onCleanup(() => observer.disconnect())

  return (
    <div class="flex w-full flex-col justify-items-stretch gap-4">
      {/*<For each={groupRoutes([])}>*/}

      {/*TODO: this results in duplicate headers*/}
      <For each={pageNumbers()}>
        {(_, i) => {
          const [routes] = createResource(() => i(), getPage)
          return (
            <Suspense
              fallback={
                <Index each={new Array(PAGE_SIZE)}>{() => <div class="skeleton-loader flex h-[140px] flex-col rounded-lg" />}</Index>
              }
            >
              <For each={groupRoutes(routes())}>
                {(group) => (
                  <>
                    <h2 class="px-4 text-xl font-bold">{group.day}</h2>
                    <For each={group.segments}>{(route) => <RouteCard route={route} />}</For>
                    <div class="6 w-full" />
                  </>
                )}
              </For>
            </Suspense>
          )
        }}
      </For>
      <div ref={setSentinel} class="h-10 w-full" />
    </div>
  )
}

export default RouteList
