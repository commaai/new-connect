import { createEffect, createResource, createSignal, Suspense, type VoidComponent } from 'solid-js'

import { setRouteViewed } from '~/api/athena'
import { getDevice } from '~/api/devices'
import { getProfile } from '~/api/profile'
import { getRoute } from '~/api/route'
import { dayjs } from '~/utils/format'

import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'
import RouteActions from '~/components/RouteActions'
import RouteDynamicMap from '~/components/RouteDynamicMap'
import RouteStatistics from '~/components/RouteStatistics'
import RouteVideoPlayer from '~/components/RouteVideoPlayer'
import RouteUploadButtons from '~/components/RouteUploadButtons'
import Timeline from '~/components/Timeline'
import Icon from '~/components/material/Icon'

type RouteActivityProps = {
  dongleId: string
  dateStr: string
  startTime: number
}

const RouteActivity: VoidComponent<RouteActivityProps> = (props) => {
  const [seekTime, setSeekTime] = createSignal(props.startTime)
  const [videoRef, setVideoRef] = createSignal<HTMLVideoElement>()
  const [popupState, setPopupState] = createSignal(1)
  let intervalId: NodeJS.Timer | null = null
  const routeName = () => `${props.dongleId}|${props.dateStr}`
  const [route] = createResource(routeName, getRoute)
  const [startTime] = createResource(route, (route) => dayjs(route.start_time)?.format('ddd, MMM D, YYYY'))

  function onTimelineChange(newTime: number) {
    const video = videoRef()
    if (video) video.currentTime = newTime
  }

  const [device] = createResource(() => props.dongleId, getDevice)
  const [profile] = createResource(getProfile)
  createResource(
    () => [device(), profile(), props.dateStr] as const,
    async ([device, profile, dateStr]) => {
      if (!device || !profile || (!device.is_owner && !profile.superuser)) return
      await setRouteViewed(device.dongle_id, dateStr)
    },
  )
  createEffect(() => {
    if (popupState() === 0) {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    } else {
      if (!intervalId) {
        intervalId = setInterval(() => {
          setPopupState((prev) => (prev === 1 ? 2 : 1))
        }, 4000)
      }
    }
  })

  return (
    <>
      <TopAppBar leading={<IconButton class="md:hidden" name="arrow_back" href={`/${props.dongleId}`} />}>{startTime()}</TopAppBar>

      <div class="flex flex-col gap-6 px-4 pb-4">
        <Suspense fallback={<div class="skeleton-loader aspect-[241/151] rounded-lg bg-surface-container-low" />}>
          <RouteVideoPlayer ref={setVideoRef} routeName={routeName()} startTime={seekTime()} onProgress={setSeekTime} />
        </Suspense>

        <div class="flex flex-col gap-2">
          <h3 class="text-label-sm uppercase">Route Map</h3>
          <div class="aspect-square max-h-64 overflow-hidden rounded-lg">
            <Suspense fallback={<div class="skeleton-loader size-full bg-surface" />}>
              <RouteDynamicMap route={route()} routeName={routeName()} seekTime={seekTime} updateTime={onTimelineChange} />
            </Suspense>
          </div>
          {popupState() !== 0 && (
            <div class="flex items-center justify-center gap-2 rounded-md p-2 lg:text-sm text-xs">
              {popupState() === 1 ? (
                <>
                  Tap <Icon size="20" name="lock" class="bg-primary-container rounded-md" /> to lock/unlock the map
                </>
              ) : (
                <>
                  Drag <Icon size="20" name="directions_car" class="bg-primary-container rounded-md" /> or tap on the path to seek freely
                </>
              )}
              <p class="text-gray-500 underline" onClick={() => setPopupState(0)}>
                Hide
              </p>
            </div>
          )}
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="text-label-sm uppercase">Timeline</h3>
          <Timeline class="mb-1" route={route.latest} seekTime={seekTime()} updateTime={onTimelineChange} />
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="text-label-sm uppercase">Route Info</h3>
          <div class="flex flex-col rounded-md overflow-hidden bg-surface-container">
            <RouteStatistics class="p-5" route={route()} />

            <Suspense fallback={<div class="skeleton-loader min-h-48" />}>
              <RouteActions routeName={routeName()} route={route()} />
            </Suspense>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="text-label-sm uppercase">Upload Files</h3>
          <div class="flex flex-col rounded-md overflow-hidden bg-surface-container">
            <Suspense fallback={<div class="skeleton-loader min-h-48" />}>
              <RouteUploadButtons route={route()} />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  )
}

export default RouteActivity
