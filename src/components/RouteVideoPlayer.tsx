import { createEffect, createResource, onCleanup, onMount } from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'
import Hls from 'hls.js'

import { getQCameraStreamUrl } from '~/api/route'

type RouteVideoPlayerProps = {
  class?: string
  routeName: string
  onProgress?: (seekTime: number) => void
}

const RouteVideoPlayer: VoidComponent<RouteVideoPlayerProps> = (props) => {
  const [streamUrl] = createResource(() => props.routeName, getQCameraStreamUrl)
  let video: HTMLVideoElement

  onMount(() => {
    const timeUpdate = () => props.onProgress?.(video.currentTime)
    video.addEventListener('timeupdate', timeUpdate)
    onCleanup(() => video.removeEventListener('timeupdate', timeUpdate))
  })

  let hls: Hls | undefined = undefined
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

  return (
    <div
      class={clsx(
        'relative flex aspect-[241/151] items-center justify-center self-stretch overflow-hidden rounded-lg bg-surface',
        props.class,
      )}
    >
      <video
        ref={video!}
        class="absolute inset-0 size-full object-cover"
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
