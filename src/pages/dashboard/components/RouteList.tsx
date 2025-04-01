import { batch, createEffect, createResource, For, onCleanup, onMount, Show, Suspense, type VoidComponent } from 'solid-js'
import { createStore } from 'solid-js/store'
import dayjs from 'dayjs'

import { fetcher } from '~/api'
import { getTimelineStatistics } from '~/api/derived'
import type { RouteSegments } from '~/api/types'
import Card, { CardContent, CardHeader } from '~/components/material/Card'
import Icon from '~/components/material/Icon'
import RouteStatistics from '~/components/RouteStatistics'
import { getPlaceName } from '~/map/geocode'

interface RouteCardProps {
  route: RouteSegments
}

const RouteCard: VoidComponent<RouteCardProps> = (props) => {
  const startTime = () => dayjs(props.route.start_time_utc_millis)
  const endTime = () => dayjs(props.route.end_time_utc_millis)
  const [timeline] = createResource(() => props.route, getTimelineStatistics)
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
          <div class="flex gap-2">
            <span>{startTime().format('ddd, MMM D, YYYY')}</span>&middot;
            <span>
              {startTime().format('h:mm A')} to {endTime().format('h:mm A')}
            </span>
          </div>
        }
        subhead={location()}
        trailing={
          <Suspense>
            <Show when={timeline()?.userFlags}>
              <div class="flex items-center justify-center rounded-full p-1 border-amber-300 border-2">
                <Icon class="text-yellow-300" size="24" name="flag" filled />
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

const PAGE_SIZE = 20

const RouteList: VoidComponent<{ dongleId: string }> = (props) => {
  const [store, setStore] = createStore<{ routes: Promise<RouteSegments>[]; length: number }>({
    routes: [],
    length: 0,
  })

  createEffect(() => {
    if (!props.dongleId) return
    setStore({ routes: [], length: 0 })
  })

  createEffect(async () => {
    const { length } = store.routes
    const limit = store.length - length
    if (limit <= 0) return
    let key = `/v1/devices/${props.dongleId}/routes_segments?limit=${limit}`
    const lastRoute = await store.routes.at(-1)
    if (lastRoute) key += `&end=${lastRoute.start_time_utc_millis - 1}`
    const results = fetcher<RouteSegments[]>(key)
    batch(() => {
      for (let i = 0; i < limit; i++) {
        const routeAsync = results.then((routes) => routes[i])
        setStore('routes', length + i, routeAsync)
      }
    })
  })

  let sentinel!: HTMLDivElement
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return
      setStore('length', (length) => length + PAGE_SIZE)
    },
    { rootMargin: '30px', threshold: 0.1 },
  )
  onMount(() => observer.observe(sentinel))
  onCleanup(() => observer.disconnect())

  return (
    <div class="flex w-full flex-col justify-items-stretch gap-4">
      <For each={store.routes}>
        {(routeAsync) => {
          // This feels suboptimal
          const [route] = createResource(() => routeAsync)
          return (
            <Suspense fallback={<div class="skeleton-loader flex h-[140px] flex-col rounded-lg" />}>
              <Show when={route()} keyed fallback={<div class="skeleton-loader flex h-[140px] flex-col rounded-lg" />}>
                {(route) => <RouteCard route={route} />}
              </Show>
            </Suspense>
          )
        }}
      </For>
      <div ref={sentinel} class="h-10 w-full" />
    </div>
  )
}

export default RouteList
