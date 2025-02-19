import { createSignal, Show, type VoidComponent, Suspense } from 'solid-js'
import clsx from 'clsx'
import Icon from '~/components/material/Icon'
import type { Route } from '~/types'
import RouteStatistics from './RouteStatistics'
import RouteActions from './RouteActions'

interface RouteInfoProps {
  route: Route | undefined
  routeName: string
}

const RouteInfo: VoidComponent<RouteInfoProps> = (props) => {
  const [expanded, setExpanded] = createSignal(false)

  return (
    <div class="flex flex-col">
      <div class="rounded-t-md bg-surface-container-low p-5">
        <RouteStatistics route={props.route} />
      </div>

      <Show when={expanded()}>
        <Suspense fallback={<div class="skeleton-loader min-h-80 rounded-lg bg-surface-container-low" />}>
          <RouteActions routeName={props.routeName} />
        </Suspense>
      </Show>

      <button
        class={clsx(
          'flex w-full cursor-pointer justify-center rounded-b-md bg-surface-container-lowest p-2 hover:bg-black/45',
          expanded() ? 'border-2 border-t-0 border-surface-container-high' : '',
        )}
        onClick={() => setExpanded(prev => !prev)}
      >
        <Icon class={expanded() ? 'text-yellow-400' : 'text-zinc-500'}>
          {expanded() ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
        </Icon>
      </button>
    </div>
  )
}

export default RouteInfo
