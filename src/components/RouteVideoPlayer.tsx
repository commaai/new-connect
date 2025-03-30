import { createEffect, createResource, createSignal, onCleanup, onMount, type VoidComponent } from 'solid-js'
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
  const [hls, setHls] = createSignal<Hls | null>()
  let video!: HTMLVideoElement

  onMount(() => {
    const timeUpdate = () => props.onProgress?.(video.currentTime)
    video.addEventListener('timeupdate', timeUpdate)
    onCleanup(() => video.removeEventListener('timeupdate', timeUpdate))

    if (!Number.isNaN(props.startTime)) {
      video.currentTime = props.startTime
    }

    props.ref?.(video)

    if ('MediaSource' in window) {
      import('~/utils/hls').then(({ createHls }) => {
        const player = createHls()
        player.attachMedia(video)
        setHls(player)
      })
      onCleanup(() => hls()?.destroy())
    } else {
      setHls(null)
      if (!video.canPlayType('application/vnd.apple.mpegurl')) {
        console.error('Browser does not support Media Source Extensions API')
      }
    }
  })

  createEffect(() => {
    const url = streamUrl()
    const player = hls()
    if (!url || player === undefined) return

    if (player) {
      player.loadSource(url)
    } else {
      video.src = url
    }
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
