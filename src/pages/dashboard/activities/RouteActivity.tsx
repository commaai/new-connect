import {
  createResource,
  createSignal,
  createEffect,
  createMemo,
  lazy,
  Suspense,
  type VoidComponent,
} from 'solid-js'

import { getRoute } from '~/api/route'

import Timeline from '~/components/Timeline'
import { parseDateStr } from '~/utils/date'


import type { Route } from '~/types'

const RouteVideoPlayer = lazy(() => import('~/components/RouteVideoPlayer'))

import RouteDynamicMap from '~/components/RouteDynamicMap'

type RouteOptionsProps = {
  route?: Route;
}

const RouteOptions: VoidComponent<RouteOptionsProps> = (props) => {
  const [isPreservedChecked, setIsPreservedChecked] = createSignal(true)
  const [isPublicAccessChecked, setIsPublicAccessChecked] = createSignal(false)

  const [routeId, setRouteId] = createSignal<string | undefined>()

  createEffect(() => {
    const routeFullName = props?.route?.fullname
    setRouteId(routeFullName?.split('|')[1])
  })

  return (
    <div class="mt-6 flex w-[73%] flex-col gap-6">
      <div class="flex justify-between">
        <div class="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md bg-surface-bright p-2 px-12 py-2.5 font-semibold hover:opacity-80">
          <span class="material-symbols-outlined icon-filled">file_copy</span>
          Route ID
        </div>
        <div class="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md bg-surface-bright p-2 px-12 py-2.5 font-semibold hover:opacity-80">
          <span class="material-symbols-outlined icon-filled">share</span>
          Share
        </div>
      </div>
      <div class="flex items-center gap-2 rounded-md bg-surface-bright p-3 text-sm font-semibold">
        Route ID: <span class="font-regular">{routeId()}</span>
      </div>
      <div class="flex flex-col rounded-md bg-surface-bright">
        <div class="flex items-center justify-between border-b border-gray-900 p-3 pr-5 text-[15px] font-semibold">
          Preserved
          <label class="custom-switch">
            <input type="checkbox" checked={isPreservedChecked()} onChange={(e) => setIsPreservedChecked(e.currentTarget.checked)} />
            <span class="custom-slider round" />
          </label>
        </div>
        <div class="flex items-center justify-between border-b border-gray-900 p-3 pr-5 text-[15px] font-semibold">
          Public Access
          <label class="custom-switch">
            <input type="checkbox" checked={isPublicAccessChecked()} onChange={(e) => setIsPublicAccessChecked(e.currentTarget.checked)} />
            <span class="custom-slider round" />
          </label>
        </div>
      </div>
      <div class="flex flex-col rounded-md bg-surface-bright">
        <div class="flex cursor-pointer items-center justify-between border-b border-gray-900 p-3 pr-4 text-[15px] font-semibold hover:opacity-60">
          View in useradmin
          <span class="material-symbols-outlined text-[35px]">
            keyboard_arrow_right
          </span>
        </div>
        <div class="flex cursor-pointer items-center justify-between border-b border-gray-900 p-3 pr-5 text-[15px] font-semibold hover:opacity-60">
          Upload Options
          <span class="material-symbols-outlined icon-filled text-[25px]">
            cloud_upload
          </span>
        </div>
      </div>
    </div>
  )
}

type RouteActivityProps = {
  dongleId: string
  dateStr: string
  viewType: string
}

const RouteActivity: VoidComponent<RouteActivityProps> = (props) => {
  const [seekTime, setSeekTime] = createSignal(0)

  const routeName = () => `${props.dongleId}|${props.dateStr}`
  const [route] = createResource(routeName, getRoute)
  const [startTime] = createResource(route, (route) => parseDateStr(route.start_time)?.format('h:mm'))
  const [endTime] = createResource(route, (route) => parseDateStr(route.end_time)?.format('h:mm'))
  const [routeDate] = createResource(route, (route) => parseDateStr(route.start_time)?.format('MMM D, YYYY'))

  const [activityBody, setActivityBody] = createSignal('isRouteOptions')

  const isLarge = createMemo(() => props.viewType === 'large')
  const rounded = isLarge() ? 'rounded-lg' : ''

  return (
    <div class={`flex h-full max-w-[500px] grow flex-col ${rounded} bg-surface-container`}>

      <div
        class="relative flex h-16 items-center justify-center gap-4 px-4 py-5 text-on-surface"
      >
        <a href={`/${props.dongleId}`} class="absolute left-6 flex h-full items-center">
          {isLarge() && <span class="material-symbols-outlined">close</span>}
          {!isLarge() && <span class="material-symbols-outlined">arrow_back</span>}
        </a>
        <div class="flex size-fit gap-3">
          <p class="text-lg font-semibold">{startTime()} to {endTime()}</p>
          <span class="text-lg">•</span>
          <p class="text-lg font-regular text-slate-300">{routeDate()}</p>
        </div>
      </div>

      <div class="flex flex-col items-center">
        <Suspense
          fallback={
            <div class="skeleton-loader aspect-[241/151] bg-surface-container-low" />
          }
        >
          <RouteVideoPlayer routeName={routeName()} onProgress={setSeekTime} />
        </Suspense>
        <Timeline class="mb-1" route={route()} seekTime={seekTime()} />

        <div class="w-full justify-center" style={{ display: activityBody() === 'isRouteOptions' ? 'flex' : 'none' }}>
          {route() && <RouteOptions route={route()} />}
        </div>
        <div class="flex w-full flex-col p-2" style={{ display: activityBody() === 'isMap' ? 'flex' : 'none' }}>
          <code class="mt-2 pl-1">Route Map</code>
          <RouteDynamicMap route={route()} />
        </div>

        <div class="my-5 flex flex-col gap-2 p-4">
          {activityBody() === 'isMap' && (
            <div
              class="cursor-pointer rounded-lg bg-[#bbc4fd] px-5 py-2 font-medium text-black hover:opacity-85"
              onClick={() => setActivityBody('isRouteOptions')}
            >
              Show Options
            </div>)}
          {activityBody() === 'isRouteOptions' && (
            <div
              class="cursor-pointer rounded-lg bg-[#bbc4fd] px-5 py-2 font-medium text-black hover:opacity-85"
              onClick={() => setActivityBody('isMap')}
            >
              Show Map
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RouteActivity
