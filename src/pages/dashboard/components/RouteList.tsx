import {
  createEffect, createResource, createSignal, For, Index, onCleanup, onMount, Suspense, type VoidComponent,
} from 'solid-js'
import dayjs from 'dayjs'
import SunCalc from 'suncalc'
import kelvinToRgb from 'kelvin-to-rgb'

import { fetcher } from '~/api'
import Card, { CardContent, CardHeader } from '~/components/material/Card'
import RouteStatistics from '~/components/RouteStatistics'
import { getPlaceName } from '~/map/geocode'
import type { RouteSegments } from '~/types'
import { useDimensions } from '~/utils/window'


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
  const [location] = createResource(() => [startPlace(), endPlace()], ([startPlace, endPlace]) => {
    if (!startPlace && !endPlace) return ''
    if (!endPlace || startPlace === endPlace) return startPlace
    if (!startPlace) return endPlace
    return `${startPlace} to ${endPlace}`
  })

  const dayNightFraction = () => {
    const times = SunCalc.getTimes(endTime(), props.route.end_lat, props.route.end_lng);
    const now_ts = endTime().valueOf();

    if (times.goldenHourEnd.valueOf() < now_ts && now_ts < times.goldenHour.valueOf()) {
      // "Daytime"
      return Number.POSITIVE_INFINITY;
    } else if (times.nightEnd.valueOf() <= now_ts && now_ts <= times.night.valueOf()) {
      // The idea here is to color code with some sort of "sunlight" color temperature, based on latitude & longitude and time of day
      var percentage = 1.0;

      // Temperature calculation from https://github.com/claytonjn/hass-circadian_lighting/blob/2f87bdaf86c602983c054b3f6fcd51a5198c1c20/custom_components/circadian_lighting/__init__.py#L295 instead
      if(now_ts < times.solarNoon.valueOf()) {
        percentage = 1.0 - Math.pow((times.solarNoon.valueOf() - now_ts)/(times.solarNoon.valueOf() - times.nightEnd.valueOf()), 2);
      }
      if(now_ts > times.solarNoon.valueOf()) {
        percentage = 1.0 - Math.pow((now_ts - times.solarNoon.valueOf())/(times.night.valueOf() - times.solarNoon.valueOf()), 2);
      }

      // INVARIANT: If you get here, `percentage` is between 0.0 and 1.0
      return percentage;
    } else {
      // "Nighttime"
      return null;
    }

  };

  const sunlightBorderStyle = () => {
    const percentage = dayNightFraction();

    if (percentage === null) {
      // No border at night. (There's no sun at night, anyway.)
      return '0px none transparent';
    } else {
      const max_w = Math.PI / 2;
      const w = Math.sin(SunCalc.getPosition(endTime(), props.route.end_lat, props.route.end_lng).altitude) / max_w;
      const sunBorderPx = 1 * (1 - w) + 4 * (w); // interpolate from 1px to 3px

      var sunColorRgb;
      if (0.0 <= percentage && percentage <= 1.0) {
        const k = 2500 * (1 - percentage) + 5500 * (percentage); // interpolate from 2500K to 5500K
        sunColorRgb = kelvinToRgb(k);
      } else {
        // If you want to actually calculate sky blue, you'll need something like https://github.com/elonen/js-sky-sim/blob/7e45f96a7842a1f8fc5a495d6bb15e914c54b0fb/sky-sim.html#L105
        // Or if you want something trivially simple instead, try https://github.com/x8BitRain/meta-theme-sky-color
        sunColorRgb = kelvinToRgb(40000);
      }

      return sunBorderPx + 'px solid rgb(' + sunColorRgb[0] + ',' + sunColorRgb[1] + ',' + sunColorRgb[2] + ')';
    }

  };

  return (
    <div
      style:border-radius="1.5ex"
      style:border-top={sunlightBorderStyle()}
      style:border-right={sunlightBorderStyle()}
    >
      <Card
        class="max-w-none"
        href={`/${props.route.dongle_id}/${props.route.fullname.slice(17)}`}
        activeClass="md:before:bg-primary"
      >
        <CardHeader
        headline={<div class="flex gap-2"><span>{startTime().format('ddd, MMM D, YYYY')}</span>&middot;<span>{startTime().format('h:mm A')} to {endTime().format('h:mm A')}</span></div>}
        subhead={location()}
        />

        <CardContent>
          <RouteStatistics route={props.route} />
        </CardContent>
      </Card>
    </div>
  )
}


type RouteListProps = {
  dongleId: string
}

const RouteList: VoidComponent<RouteListProps> = (props) => {
  const dimensions = useDimensions()
  const pageSize = () => Math.max(Math.ceil((dimensions().height / 2) / 140), 1)
  const endpoint = () => `/v1/devices/${props.dongleId}/routes_segments?limit=${pageSize()}`
  const getKey = (previousPageData?: RouteSegments[]): string | undefined => {
    if (!previousPageData) return endpoint()
    if (previousPageData.length === 0) return undefined
    return `${endpoint()}&end=${previousPageData.at(-1)!.start_time_utc_millis - 1}`
  }
  const getPage = (page: number): Promise<RouteSegments[]> => {
    if (pages[page] === undefined) {
      pages[page] = (async () => {
        const previousPageData = page > 0 ? await getPage(page - 1) : undefined
        const key = getKey(previousPageData)
        return key ? fetcher<RouteSegments[]>(key) : []
      })()
    }
    return pages[page]
  }

  const pages: Promise<RouteSegments[]>[] = []
  const [size, setSize] = createSignal(1)
  const pageNumbers = () => Array.from({ length: size() })

  createEffect(() => {
    if (props.dongleId) {
      pages.length = 0
      setSize(1)
    }
  })

  const [sentinel, setSentinel] = createSignal<HTMLDivElement>()
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      setSize((prev) => prev + 1)
    }
  }, { threshold: 0.1 })
  onMount(() => {
    const sentinelEl = sentinel()
    if (sentinelEl) {
      observer.observe(sentinelEl)
    }
  })
  onCleanup(() => observer.disconnect())

  return (
    <div class="flex w-full flex-col justify-items-stretch gap-4">
      <For each={pageNumbers()}>
        {(_, i) => {
          const [routes] = createResource(() => i(), getPage)
          return (
            <Suspense
              fallback={<Index each={new Array(pageSize())}>{() => (
                <div class="skeleton-loader flex h-[140px] flex-col rounded-lg" />
              )}</Index>}
            >
              <For each={routes()}>
                {(route) => <RouteCard route={route} />}
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
