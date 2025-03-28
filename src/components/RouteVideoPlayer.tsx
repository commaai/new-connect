import { createEffect, createResource, onCleanup, onMount, type VoidComponent } from 'solid-js'
import clsx from 'clsx'

import { getQCameraStreamUrl } from '~/api/route'
import type Hls from '~/utils/hls'

type RouteVideoPlayerProps = {
  class?: string
  routeName: string
  startTime: number
  onProgress?: (seekTime: number) => void
  ref?: (el: HTMLVideoElement) => void
}

const RouteVideoPlayer: VoidComponent<RouteVideoPlayerProps> = (props) => {
  const [streamUrl] = createResource(() => props.routeName, getQCameraStreamUrl)
  let video!: HTMLVideoElement

  onMount(() => {
    const timeUpdate = () => props.onProgress?.(video.currentTime)
    video.addEventListener('timeupdate', timeUpdate)
    onCleanup(() => video.removeEventListener('timeupdate', timeUpdate))
    if (Number.isNaN(props.startTime)) return
    video.currentTime = props.startTime
    props.ref?.(video)
  })

  createEffect(() => {
    if (!streamUrl()) return

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl()!
      return
    }

    if (!('MediaSource' in window)) {
      console.error('Browser does not support Media Source Extensions API')
      return
    }

    let player: Hls
    void import('~/utils/hls').then(({ createHls }) => {
      player = createHls()
      player.loadSource(streamUrl()!)
      player.attachMedia(video)
    })
    onCleanup(() => player?.destroy())
  })

  return (
    <div
      class={clsx(
        'relative flex aspect-[241/151] items-center justify-center self-stretch overflow-hidden rounded-lg bg-surface-container-low',
        props.class,
      )}
    >
      <video
        ref={video}
        class="absolute inset-0 size-full object-cover"
        data-testid="route-video"
        autoplay
        muted
        controls
        playsinline
        loop
      />
    </div>
  )
}

export default RouteVideoPlayer
