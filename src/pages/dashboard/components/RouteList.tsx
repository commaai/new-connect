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
import { useQueryClient } from '@tanstack/solid-query'
import { queries } from '../activities/RouteActivity'

interface RouteCardProps {
  route: Route
}

const RouteCard: VoidComponent<RouteCardProps> = (props) => {
  const startTime = () => dayjs.utc(props.route.start_time).local()
  const endTime = () => dayjs.utc(props.route.end_time).local()
  const color = () => dateTimeToColorBetween(startTime().toDate(), endTime().toDate(), [30, 57, 138], [218, 161, 28])
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
        headline={
          <span>
            {startTime().format('h:mm A')} to {endTime().format('h:mm A')}
          </span>
        }
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
      <div class="h-2.5 w-full" style={{ background: color() }} />
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
  const queryClient = useQueryClient()
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
                  queryClient.setQueryData(queries.forRouteName(route.fullname), route)
                  return (
                    <>
                      <Show when={dayHeader}>
                        <Show when={!firstHeader}>
                          <div class="6 w-full" />
                        </Show>
                        <h2 class="px-4 text-xl font-bold">{dayHeader}</h2>
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
