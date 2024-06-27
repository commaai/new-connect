import {
  createEffect,
  createResource,
  createSignal,
  lazy,
  Suspense,
  useContext,
  type VoidComponent,
  Show,
} from 'solid-js'
import { createShortcut } from '@solid-primitives/keyboard'

import { getRoute } from '~/api/route'
import IconButton from '~/components/material/IconButton'
import Timeline from '~/components/Timeline'
import { parseDateStr } from '~/utils/date'
import { DashboardContext, generateContextType } from '../Dashboard'
import Icon from '~/components/material/Icon'
import DriveMap from '~/map/DriveMap'
import { DriveStatistics } from '~/components/RouteStatistics'
import { getCoords } from '~/api/derived'
import { useNavigate } from '@solidjs/router'

const RouteVideoPlayer = lazy(() => import('~/components/RouteVideoPlayer'))

type RouteActivityProps = {
  dongleId: string | undefined
  dateStr: string | undefined
}

const RouteActivity: VoidComponent<RouteActivityProps> = (props) => {

  const navigate = useNavigate()

  const [seekTime, setSeekTime] = createSignal(0)
  const { isDesktop, width } = useContext(DashboardContext) ?? generateContextType()

  const routeName = () => `${props.dongleId}|${props.dateStr}`
  const [route] = createResource(routeName, getRoute)
  const [coords] = createResource(() => route(), getCoords)

  const [startTime] = createResource(route, (route) => parseDateStr(route.start_time)?.format('dddd, MMM D, YYYY'))
  const [videoHeight, setVideoHeight] = createSignal(60)
  const [speed, setSpeed] = createSignal(0)

  createShortcut(
    ['ESC'],
    () => navigate(`/${props.dongleId}`),
    { preventDefault: true },
  )

  createEffect(() => {
    setVideoHeight(90 - width())
  })

  const copyToClipboard = () => {
    navigator.clipboard.writeText(props.dateStr || '')
      .then(() => {})
      .catch(() => {})
  }

  const shareDrive = () => {
    navigator.share({ url: window.location.href })
      .then(() => {})
      .catch(() => {})
  }

  createEffect(() => {
    const coord = coords.latest?.find(coord => coord.t === Math.round(seekTime()))
    setSpeed(coord ? Math.round(coord.speed) : 0)
  })

  type ActionProps = {
    icon?: string
    label: string
    selectable?: boolean
    selected?: boolean
    onClick?: () => void
  }
  const Action: VoidComponent<ActionProps> = (props) => {
    const [selected, setSelected] = createSignal(props.selected)
    return <div class="flex w-full items-center justify-center" >
      <div
        onClick={() => {
          if(props.selectable) setSelected(!selected())
          if(props.onClick) props.onClick()
        }} 
        class={`mx-1 flex size-full items-center justify-center space-x-2 rounded-md border-2 border-secondary-container p-2 lg:h-3/4 ${selected() ? 'bg-primary-container' : 'hover:bg-secondary-container'}`}
      >
        <Icon class={selected() ? 'text-on-primary-container' :'text-on-secondary-container'} size="20">{`${props.icon}`}</Icon>
        <p class={`text-center text-sm ${selected() ? 'text-on-primary-container' : 'text-on-secondary-container'}`}>{props.label}</p>
      </div>
    </div>
  }

  return <div class="flex size-full flex-col">
    <div class="flex max-h-[15vh] basis-2/12 lg:basis-3/12">
      <div class="flex basis-16 items-center justify-center">
        <div class="flex size-1/2 items-center justify-center rounded-full hover:bg-secondary-container">
          <IconButton href={`/${props.dongleId}`}>{isDesktop() ? 'close' : 'arrow_back_ios'}</IconButton>
        </div>
      </div>
      <div class="flex basis-11/12 flex-col justify-center space-y-1">
        <h1 class="text-xl">{startTime()}</h1>
        <div class="flex h-1/4 w-full items-center space-x-2 lg:w-3/4">
          <p class="text-on-secondary-container">{props.dongleId}</p>
        </div>
      </div>
    </div>
    <div class="flex basis-10/12 flex-col items-center px-2 py-0 lg:basis-8/12 lg:justify-center lg:p-6" >
      <div style={{ height: `${isDesktop() ? videoHeight() : 50}%`, width: `${isDesktop() ? 120 - width() : 100}%` }} class="flex w-full flex-col-reverse items-center justify-center lg:flex-row lg:space-x-10">
        <div class="flex size-full flex-col items-center justify-center lg:w-2/12">
          <DriveStatistics route={route()} />
        </div>
        <div class="flex h-full w-full lg:w-11/12 flex-col">
          <Suspense
            fallback={
              <div class="skeleton-loader aspect-[241/151] rounded-lg bg-surface-container-low" />
            }
          >
            <div class="relative left-2 top-10 z-40 flex h-8 w-20 items-center justify-center rounded-lg bg-primary-container px-2 py-1 text-on-primary-container sm:left-4">
              <p class="text-xs">{speed()} mph</p>
            </div>
            <RouteVideoPlayer routeName={routeName()} onProgress={setSeekTime} />
            <Timeline class="mb-4" routeName={routeName()} seekTime={seekTime()} />
          </Suspense>
        </div>
      </div>
      <div style={{ height: `${isDesktop() ? 100 - videoHeight() : 70}%` }} class="flex w-full flex-col lg:flex-row" >
        <div class="flex size-full basis-6/12 items-center justify-center p-4 lg:basis-8/12">
          <Suspense fallback={<div class="skeleton-loader size-full bg-surface" />} >
            <Show when={coords.latest}>
              <DriveMap coords={coords.latest || []} point={seekTime()} />
            </Show>
          </Suspense>
        </div>
        <div class="flex basis-4/12 flex-col items-center justify-center p-4">
          <div class="grid size-full h-full grid-cols-2 grid-rows-3 space-y-2 rounded-md lg:h-3/4">
            <Action selectable selected label="Preserved" icon="hide_source" />
            <Action selectable label="Public Access" icon="key" />
            <Action label="View in useradmin" icon="admin_panel_settings" />
            <Action label="Upload options" icon="cloud_upload" />
            <Action onClick={copyToClipboard} label="Copy ID" icon="content_copy" />
            <Action onClick={shareDrive} label="Share route" icon="share" /> 
          </div>
          {/* <Show when={isDesktop()}>
            <DriveStatistics route={route()} />
          </Show> */}
        </div>
      </div>
    </div>
  </div>
}

export default RouteActivity
