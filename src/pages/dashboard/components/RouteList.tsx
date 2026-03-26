import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  Index,
  Match,
  Show,
  Suspense,
  Switch,
  type VoidComponent,
} from 'solid-js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
dayjs.extend(utc)
dayjs.extend(timezone)

import { fetcher } from '~/api'
import { getRouteStatistics } from '~/api/derived'
import { getPreservedRoutes } from '~/api/route'
import Card, { CardContent, CardHeader } from '~/components/material/Card'
import Icon from '~/components/material/Icon'
import RouteStatisticsBar from '~/components/RouteStatisticsBar'
import { getPlaceName } from '~/map/geocode'
import type { Route } from '~/api/types'
import { dateTimeToColorBetween } from '~/utils/format'

interface RouteCardProps {
  route: Route
  isSaved: boolean
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
        headline={`${startTime().format('h:mm A')} to ${endTime().format('h:mm A')}`}
        subhead={<Suspense fallback={<div class="h-[20px] w-auto skeleton-loader rounded-xs" />}>{location()}</Suspense>}
        trailing={
          <div class="flex items-center gap-2">
            <Show when={props.isSaved}>
              <span class="rounded-full bg-surface-container-high px-2 py-1 text-[11px] font-semibold text-on-surface-variant">Saved</span>
            </Show>
            <Suspense>
              <Show when={statistics()?.userFlags}>
                <div class="flex items-center justify-center rounded-full border-2 border-amber-300 p-1">
                  <Icon class="text-yellow-300" size="24" name="flag" filled />
                </div>
              </Show>
            </Suspense>
          </div>
        }
      />

      <CardContent>
        <RouteStatisticsBar route={props.route} statistics={statistics} />
      </CardContent>
      <div class="h-2.5 w-full" style={{ background: color() }} />
    </Card>
  )
}

type RouteFilter = 'all' | 'recent' | 'saved'

const PAGE_SIZE = 10

const RouteList: VoidComponent<{ dongleId: string }> = (props) => {
  const [size, setSize] = createSignal(1)
  const [filter, setFilter] = createSignal<RouteFilter>('all')

  const [preservedRoutes] = createResource(() => props.dongleId, getPreservedRoutes)
  const [routes] = createResource(
    () => ({ dongleId: props.dongleId, size: size() }),
    async ({ dongleId, size }) => {
      const pages: Route[] = []
      let createdBefore: number | undefined
      for (let i = 0; i < size; i += 1) {
        const params = new URLSearchParams({ limit: PAGE_SIZE.toString() })
        if (createdBefore) params.set('created_before', createdBefore.toString())
        const page = await fetcher<Route[]>(`/v1/devices/${dongleId}/routes?${params.toString()}`).catch(() => [])
        pages.push(...page)
        if (page.length < PAGE_SIZE) break
        createdBefore = page.at(-1)?.create_time
      }
      return pages
    },
  )

  const savedRoutes = createMemo(() => new Set((preservedRoutes() ?? []).map((route) => route.fullname)))
  const filteredRoutes = createMemo(() => {
    const allRoutes = routes() ?? []
    return allRoutes.filter((route) => {
      if (filter() === 'saved') return savedRoutes().has(route.fullname)
      if (filter() === 'recent') return dayjs.utc(route.start_time).local().isAfter(dayjs().subtract(7, 'day'))
      return true
    })
  })

  createEffect(() => {
    if (!props.dongleId) return
    setSize(1)
    setFilter('all')
  })

  return (
    <div class="flex w-full flex-col justify-items-stretch gap-4">
      <div class="rounded-lg bg-surface-container-low px-4 py-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 class="text-lg font-semibold">Trips</h2>
          <div class="flex flex-wrap gap-2">
            <For each={['all', 'recent', 'saved'] as RouteFilter[]}>
              {(value) => (
                <button
                  class={
                    filter() === value
                      ? 'rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-on-primary'
                      : 'rounded-full bg-surface-container-high px-3 py-1.5 text-sm text-on-surface-variant'
                  }
                  onClick={() => setFilter(value)}
                >
                  {
                    {
                      all: 'All',
                      recent: 'Last 7 days',
                      saved: 'Saved',
                    }[value]
                  }
                </button>
              )}
            </For>
          </div>
        </div>
      </div>

      <Suspense
        fallback={
          <>
            <h2 class="skeleton-loader min-h-7 rounded-md"></h2>
            <Index each={new Array(PAGE_SIZE)}>{() => <div class="skeleton-loader flex h-[140px] flex-col rounded-lg" />}</Index>
          </>
        }
      >
        <Switch
          fallback={
            <>
              {(() => {
                let prevDayHeader: string | null = null
                const getDayHeader = (route: Route): string | null => {
                  const date = dayjs.utc(route.start_time).local()
                  let dayHeader = null
                  if (date.isSame(dayjs(), 'day')) {
                    dayHeader = `Today - ${date.format('dddd, MMM D')}`
                  } else if (date.isSame(dayjs().subtract(1, 'day'), 'day')) {
                    dayHeader = `Yesterday - ${date.format('dddd, MMM D')}`
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
                  <For each={filteredRoutes()}>
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
                          <RouteCard route={route} isSaved={savedRoutes().has(route.fullname)} />
                        </>
                      )
                    }}
                  </For>
                )
              })()}

              <Show when={(routes()?.length ?? 0) >= size() * PAGE_SIZE}>
                <div class="flex justify-center">
                  <button
                    class="rounded-full bg-surface-container px-4 py-2 text-sm text-on-surface-variant"
                    disabled={routes.loading}
                    onClick={() => setSize((size) => size + 1)}
                  >
                    {routes.loading ? 'Loading more...' : 'Load more trips'}
                  </button>
                </div>
              </Show>
            </>
          }
        >
          <Match when={!routes.loading && (routes()?.length ?? 0) === 0}>
            <div class="rounded-lg bg-surface-container-low p-6 text-center text-on-surface-variant">
              No trips were found for this device yet.
            </div>
          </Match>
          <Match when={!routes.loading && filteredRoutes().length === 0}>
            <div class="rounded-lg bg-surface-container-low p-6 text-center text-on-surface-variant">
              No trips match the current filter. Try another filter or load more trips.
            </div>
          </Match>
        </Switch>
      </Suspense>
    </div>
  )
}

export default RouteList
