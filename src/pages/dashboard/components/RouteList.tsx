import { createEffect, createResource, createSignal, For, Index, onCleanup, onMount, Show, Suspense, type VoidComponent } from 'solid-js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
dayjs.extend(utc)
dayjs.extend(timezone)

import { fetcher } from '~/api'
import { getRouteStatistics } from '~/api/derived'
import Card, { CardContent, CardHeader } from '~/components/material/Card'
import Icon from '~/components/material/Icon'
import RouteStatisticsBar from '~/components/RouteStatisticsBar'
import { getPlaceName } from '~/map/geocode'
import type { Route } from '~/api/types'
import { dateTimeToColorBetween } from '~/utils/format'

interface RouteCardProps {
  route: Route
}

const RouteCard: VoidComponent<RouteCardProps> = (props) => {
  const startTime = () => dayjs.utc(props.route.start_time).local()
  const endTime = () => dayjs.utc(props.route.end_time).local()
  const color = () => dateTimeToColorBetween(startTime().toDate(), endTime().toDate(), [30, 57, 138], [218, 161, 28])
  const isDaytime = () => {
    const hours = (startTime().hour() + startTime().minute() / 60 + endTime().hour() + endTime().minute() / 60) / 2
    return hours > 5.5 && hours < 18.5
  }
  const [statistics] = createResource(() => props.route, getRouteStatistics)
  const [location] = createResource(async () => {
    const startPos = [props.route.start_lng || 0, props.route.start_lat || 0]
    const endPos = [props.route.end_lng || 0, props.route.end_lat || 0]
    const startPlace = await getPlaceName(startPos)
    const endPlace = await getPlaceName(endPos)
    if (!startPlace && !endPlace) return ''
    if (!endPlace || startPlace === endPlace) return startPlace
    if (!startPlace) return endPlace
    return `${startPlace} to ${endPlace}`
  })

  return (
    <Card class="max-w-none" href={`/${props.route.dongle_id}/${props.route.fullname.slice(17)}`} activeClass="md:before:bg-primary">
      <CardHeader
        headline={`${startTime().format('h:mm A')} to ${endTime().format('h:mm A')}`}
        subhead={<Suspense fallback={<div class="h-[20px] w-auto skeleton-loader rounded-xs" />}>{location()}</Suspense>}
        trailing={
          <Suspense>
            <Show when={statistics()?.userFlags}>
              <div class="flex items-center justify-center rounded-full p-1 border-amber-300 border-2">
                <Icon class="text-yellow-300" size="24" name="flag" filled />
              </div>
            </Show>
          </Suspense>
        }
      />

      <CardContent>
        <RouteStatisticsBar route={props.route} statistics={statistics} />
      </CardContent>

      <div class="flex items-center justify-end px-3 py-1.5">
        <Show
          when={isDaytime()}
          fallback={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5" style={{ color: color() }}>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            class="size-5"
            style={{ color: color() }}
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        </Show>
      </div>
    </Card>
  )
}

const Sentinel = (props: { onTrigger: () => void }) => {
  let sentinel!: HTMLDivElement
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return
      props.onTrigger()
    },
    { threshold: 0.1 },
  )
  onMount(() => observer.observe(sentinel))
  onCleanup(() => observer.disconnect())
  return <div ref={sentinel} class="h-10 w-full" />
}

const PAGE_SIZE = 10

const RouteList: VoidComponent<{ dongleId: string }> = (props) => {
  const endpoint = () => `/v1/devices/${props.dongleId}/routes?limit=${PAGE_SIZE}`
  const getKey = (previousPageData?: Route[]): string | undefined => {
    if (!previousPageData) return endpoint()
    if (previousPageData.length === 0) return undefined
    return `${endpoint()}&created_before=${previousPageData.at(-1)!.create_time}`
  }
  const getPage = (page: number): Promise<Route[]> => {
    if (pages[page] === undefined) {
      pages[page] = (async () => {
        const previousPageData = page > 0 ? await getPage(page - 1) : undefined
        const key = getKey(previousPageData)
        return key ? fetcher<Route[]>(key).catch(() => []) : []
      })()
    }
    return pages[page]
  }

  const pages: Promise<Route[]>[] = []
  const [size, setSize] = createSignal(1)
  const pageNumbers = () => Array.from({ length: size() })

  createEffect(() => {
    if (props.dongleId) {
      pages.length = 0
      setSize(1)
    }
  })

  // Group and display headers for each day
  let prevDayHeader: string | null = null
  function getDayHeader(route: Route): string | null {
    const date = dayjs.utc(route.start_time).local()
    let dayHeader = null
    if (date.isSame(dayjs(), 'day')) {
      dayHeader = `Today – ${date.format('dddd, MMM D')}`
    } else if (date.isSame(dayjs().subtract(1, 'day'), 'day')) {
      dayHeader = `Yesterday – ${date.format('dddd, MMM D')}`
    } else if (date.year() === dayjs().year()) {
      dayHeader = date.format('dddd, MMM D')
    } else {
      dayHeader = date.format('dddd, MMM D, YYYY')
    }

    if (dayHeader !== prevDayHeader) {
      prevDayHeader = dayHeader
      return dayHeader
    }
    return null
  }

  return (
    <div class="flex w-full flex-col justify-items-stretch gap-4">
      <For each={pageNumbers()}>
        {(_, i) => {
          const [routes] = createResource(() => i(), getPage)
          return (
            <Suspense
              fallback={
                <>
                  <h2 class="skeleton-loader rounded-md min-h-7"></h2>
                  <Index each={new Array(PAGE_SIZE)}>{() => <div class="skeleton-loader flex h-[140px] flex-col rounded-lg" />}</Index>
                </>
              }
            >
              <For each={routes()}>
                {(route) => {
                  const firstHeader = prevDayHeader === null
                  const dayHeader = getDayHeader(route)
                  return (
                    <>
                      <Show when={dayHeader}>
                        <Show when={!firstHeader}>
                          <div class="w-full" />
                        </Show>
                        <h2 class="px-4 text-lg font-bold text-on-surface-variant">{dayHeader}</h2>
                      </Show>
                      <RouteCard route={route} />
                    </>
                  )
                }}
              </For>
            </Suspense>
          )
        }}
      </For>
      <Sentinel onTrigger={() => setSize((size) => size + 1)} />
    </div>
  )
}

export default RouteList
