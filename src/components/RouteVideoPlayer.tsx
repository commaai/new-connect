import { createEffect, createResource, createSignal, onCleanup, onMount } from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'
import Hls from 'hls.js'

import { getQCameraStreamUrl } from '~/api/route'

import { videoTimeStore, speedStore } from './store/driveReplayStore'

type RouteVideoPlayerProps = {
  class?: string
  routeName: string
  onProgress?: (seekTime: number) => void
}

const RouteVideoPlayer: VoidComponent<RouteVideoPlayerProps> = (props) => {
  const [streamUrl] = createResource(() => props.routeName, getQCameraStreamUrl)
  let video: HTMLVideoElement

  const { setVideoTime } = videoTimeStore()
  const { speed } = speedStore()

  const [speedText, setSpeedText] = createSignal('')

  createEffect(() => {
    setSpeedText(`${Math.round(speed() * 2.23694)}`)
  })

  onMount(() => {
    const timeUpdate = () => {
      props.onProgress?.(video.currentTime)
      setVideoTime(video.currentTime)
    }
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
        'relative flex aspect-[241/151] cursor-pointer justify-end self-stretch overflow-hidden bg-surface-container-low',
        props.class,
      )}
    >
      {<p class="z-10 mx-5 my-3 h-fit rounded-lg bg-[#bbc4fd] px-3 text-[18px] font-semibold" style={{color: 'black'}}>{speedText()} <code class="font-regular">mph</code></p>}
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
