import { createResource, For, Index, onCleanup, onMount, Show, Suspense, type VoidComponent } from 'solid-js'
import { createInfiniteQuery } from '@tanstack/solid-query'
import dayjs from 'dayjs'

import { getTimelineStatistics } from '~/api/derived'
import { getRoutesSegments } from '~/api/route'
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
        <RouteStatistics route={props.route} timeline={timeline()} />
      </CardContent>
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

const PAGE_SIZE = 20

const RouteList: VoidComponent<{ dongleId: string }> = (props) => {
  const routes = createInfiniteQuery(() => ({
    queryKey: ['routes_segments', props.dongleId],
    queryFn: ({ pageParam }) => getRoutesSegments(props.dongleId, PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) return undefined
      return lastPage.at(-1)!.start_time_utc_millis - 1
    },
  }))

  const routeList = () => routes.data?.pages.flat()

  return (
    <div class="flex w-full flex-col justify-items-stretch gap-4">
      <Show when={routes.isError}>
        <div>Error: {routes.error?.message}</div>
      </Show>
      <Show when={routes.isFetched}>
        <For each={routeList()} fallback="No routes found">
          {(route) => (
            <Suspense fallback={<div class="skeleton-loader flex h-[140px] flex-col rounded-lg" />}>
              <RouteCard route={route} />
            </Suspense>
          )}
        </For>
      </Show>
      <Show when={routes.isFetchingNextPage}>
        <Index each={new Array(PAGE_SIZE)}>{() => <div class="skeleton-loader flex h-[140px] flex-col rounded-lg" />}</Index>
      </Show>
      <Sentinel onTrigger={() => routes.fetchNextPage({ cancelRefetch: false })} />
    </div>
  )
}

export default RouteList
