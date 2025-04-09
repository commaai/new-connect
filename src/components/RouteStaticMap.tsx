import { Match, Switch } from 'solid-js'
import type { JSXElement, VoidComponent } from 'solid-js'
import clsx from 'clsx'

import { GPSPathPoint, getCoords } from '~/api/derived'
import { Coords, getPathStaticMapUrl } from '~/map'
import { getThemeId } from '~/theme'
import type { Route } from '~/api/types'

import Icon from '~/components/material/Icon'
import { createQuery } from '@tanstack/solid-query'

const loadImage = (url: string | undefined): Promise<string | undefined> => {
  if (!url) {
    return Promise.resolve(undefined)
  }
  return new Promise<string>((resolve, reject) => {
    const image = new Image()
    image.src = url
    image.onload = () => resolve(url)
    image.onerror = (error) => reject(new Error('Failed to load image', { cause: error }))
  })
}

const getStaticMapUrl = (gpsPoints: GPSPathPoint[]): string | undefined => {
  if (gpsPoints.length === 0) {
    return undefined
  }
  const path: Coords = []
  gpsPoints.forEach(({ lng, lat }) => {
    path.push([lng, lat])
  })
  const themeId = getThemeId()
  return getPathStaticMapUrl(themeId, path, 512, 512, true)
}

const State = (props: {
  children: JSXElement
  trailing?: JSXElement
  opaque?: boolean
}) => {
  return (
    <div class={clsx('absolute flex size-full items-center justify-center gap-2', props.opaque && 'bg-surface text-on-surface')}>
      <span class="text-label-md">{props.children}</span>
      {props.trailing}
    </div>
  )
}

type RouteStaticMapProps = {
  class?: string
  route: Route | undefined
}

const RouteStaticMap: VoidComponent<RouteStaticMapProps> = (props) => {
  // TODO: refactor to object
  const coords = createQuery(() => ({
    queryKey: ['coords', props.route?.fullname],
    queryFn: () => getCoords(props.route!),
    enabled: !!props.route,
    refetchOnMount: false,
  }))

  const url = createQuery(() => ({
    queryKey: ['staticMapUrl', coords.data],
    queryFn: () => getStaticMapUrl(coords.data!),
    enabled: !!coords.data,
    refetchOnMount: false,
  }))

  const loadedUrl = createQuery(() => ({
    queryKey: ['loadedMapUrl', url.data],
    queryFn: () => loadImage(url.data),
    enabled: !!url.data,
    refetchOnMount: false,
  }))

  return (
    <div class={clsx('relative isolate flex h-full flex-col justify-end self-stretch bg-surface text-on-surface', props.class)}>
      <Switch>
        <Match when={!!coords.error || !!url.error || !!loadedUrl.error} keyed>
          <State trailing={<Icon name="error" filled />}>Problem loading map</State>
        </Match>
        <Match when={coords.data?.length === 0} keyed>
          <State trailing={<Icon name="satellite_alt" filled />}>No GPS data</State>
        </Match>
        <Match when={loadedUrl.data} keyed>
          <img class="pointer-events-none size-full object-cover" src={loadedUrl.data} alt="" />
        </Match>
      </Switch>
    </div>
  )
}

export default RouteStaticMap
