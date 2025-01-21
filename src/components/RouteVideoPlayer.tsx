/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import {
  createEffect,
  createResource,
  createSignal,
  onCleanup,
  onMount,
  Suspense,
} from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'
import Hls from 'hls.js/dist/hls.light.min.js'
import { getQCameraStreamUrl } from '~/api/route'
import RouteStatistics from './RouteStatistics'
import Timeline from './Timeline'
import { Route } from '~/types'

type RouteVideoPlayerProps = {
  class?: string;
  routeName: string;
  route: Route | undefined;
}

const RouteVideoPlayer: VoidComponent<RouteVideoPlayerProps> = (props) => {
  const [seekTime, setSeekTime] = createSignal(0)
  const [isDragging, setIsDragging] = createSignal(false)
  const [streamUrl] = createResource(
    () => props.routeName,
    getQCameraStreamUrl,
  )
  let video: HTMLVideoElement

  onMount(() => {
    const timeUpdate = () => setSeekTime(video.currentTime)
    video.addEventListener('timeupdate', timeUpdate)
    onCleanup(() => video.removeEventListener('timeupdate', timeUpdate))
  })

  let hls = new Hls()
  createEffect(() => {
    hls?.destroy()
    if (streamUrl()) {
      if (Hls.isSupported()) {
        hls = new Hls()
        hls.loadSource(streamUrl()!)
        hls.attachMedia(video)
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl()!
      } else {
        console.error('Browser does not support hls')
      }
    }
  })
  onCleanup(() => hls?.destroy())

  const updateSeekTimeFromMouseEvent = (e: MouseEvent) => {
    const timeline = e.currentTarget as HTMLElement
    const rect = timeline.getBoundingClientRect()
    const newSeekTime = ((e.clientX - rect.left) / rect.width) * video.duration
    setSeekTime(newSeekTime)
    video.currentTime = newSeekTime
  }

  const updateSeekTimeFromTouchEvent = (e: TouchEvent) => {
    const timeline = e.currentTarget as HTMLElement
    const rect = timeline.getBoundingClientRect()
    const newSeekTime =
      ((e.touches[0].clientX - rect.left) / rect.width) * video.duration
    setSeekTime(newSeekTime)
    video.currentTime = newSeekTime
  }

  const onTimelineMouseDown = (e: MouseEvent) => {
    setIsDragging(true)
    updateSeekTimeFromMouseEvent(e)
  }

  const onTimelineMouseMove = (e: MouseEvent) => {
    if (isDragging()) {
      updateSeekTimeFromMouseEvent(e)
    }
  }

  const onTimelineMouseUp = () => {
    setIsDragging(false)
  }

  const onTimelineTouchStart = (e: TouchEvent) => {
    setIsDragging(true)
    updateSeekTimeFromTouchEvent(e)
  }

  const onTimelineTouchMove = (e: TouchEvent) => {
    if (isDragging()) {
      updateSeekTimeFromTouchEvent(e)
    }
  }

  const onTimelineTouchEnd = () => {
    setIsDragging(false)
  }

  return (
    <>
      <div
        class={clsx(
          'relative flex aspect-[241/151] items-center justify-center self-stretch overflow-hidden rounded-lg bg-surface-container-low',
          props.class,
        )}
      >
        <video
          ref={(el) => (video = el)}
          class="absolute inset-0 size-full object-cover"
          autoplay
          muted
          controls
          playsinline
          loop
        />
      </div>

      <div class="flex flex-col gap-2">
        <h3 class="text-label-sm">Timeline</h3>
        <div
          class="relative mb-1"
          onMouseDown={onTimelineMouseDown}
          onMouseMove={onTimelineMouseMove}
          onMouseUp={onTimelineMouseUp}
          onMouseLeave={onTimelineMouseUp}
          onTouchStart={onTimelineTouchStart}
          onTouchMove={onTimelineTouchMove}
          onTouchEnd={onTimelineTouchEnd}
        >
          <Timeline
            class="h-6"
            routeName={props.routeName}
            seekTime={seekTime()}
          />
        </div>
        <Suspense fallback={<div class="h-10" />}>
          <RouteStatistics route={props.route} />
        </Suspense>
      </div>
    </>
  )
}

export default RouteVideoPlayer
