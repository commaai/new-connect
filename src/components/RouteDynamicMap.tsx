import { createResource, Match, Switch } from 'solid-js'
import type { Accessor, JSXElement, VoidComponent } from 'solid-js'
import clsx from 'clsx'

import { getCoords } from '~/api/derived'
import { getThemeId } from '~/theme'
import type { Route } from '~/api/types'

import Icon from '~/components/material/Icon'
import RoutePathMap from '~/components/RoutePathMap'

const State = (props: {
  children: JSXElement
  trailing?: JSXElement
  opaque?: boolean
}) => {
  return (
    <div class={clsx('absolute flex size-full items-center justify-center gap-2', props.opaque && 'bg-surface text-on-surface')}>
      <span class="text-label-sm">{props.children}</span>
      {props.trailing}
    </div>
  )
}

type RouteDynamicMapProps = {
  class?: string
  route: Route | undefined
  seekTime: Accessor<number>
  updateTime: (newTime: number) => void
}

const RouteDynamicMap: VoidComponent<RouteDynamicMapProps> = (props) => {
  const [coords] = createResource(() => props.route, getCoords)
  const themeId = getThemeId()

  return (
    <div class={clsx('relative isolate flex h-full flex-col justify-end self-stretch bg-surface text-on-surface', props.class)}>
      <Switch>
        <Match when={coords() === undefined || coords()?.length === 0} keyed>
          <State trailing={<Icon name="satellite_alt" filled />}>No GPS data</State>
        </Match>
        <Match when={(coords()?.length ?? 0) > 0} keyed>
          <RoutePathMap
            themeId={themeId}
            seekTime={props.seekTime}
            updateTime={props.updateTime}
            coords={coords()!}
            strokeWidth={5}
            opacity={0.8}
          />
        </Match>
      </Switch>
    </div>
  )
}

export default RouteDynamicMap
