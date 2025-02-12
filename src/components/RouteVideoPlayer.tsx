import { createEffect, createResource, onCleanup, onMount, type VoidComponent, createSignal } from 'solid-js'
import clsx from 'clsx'
import Hls from 'hls.js/dist/hls.light.mjs'
import Icon from '~/components/material/Icon'
import { formatDuration } from '~/utils/format'

import { getQCameraStreamUrl } from '~/api/route'

type RouteVideoPlayerProps = {
  class?: string
  routeName: string
  onProgress?: (time: number) => void
  ref?: (el: HTMLVideoElement) => void
}

const RouteVideoPlayer: VoidComponent<RouteVideoPlayerProps> = (props) => {
  const [streamUrl] = createResource(() => props.routeName, getQCameraStreamUrl)
  const [isPlaying, setIsPlaying] = createSignal(true)
  const [progress, setProgress] = createSignal(0)
  const [currentTime, setCurrentTime] = createSignal(0)
  const [duration, setDuration] = createSignal(0)
  let video!: HTMLVideoElement

  // Use requestAnimationFrame for smoother progress updates
  function progressLoop() {
    if (video && !video.paused) {
      const currentProgress = (video.currentTime / video.duration) * 100
      setProgress(currentProgress)
      props.onProgress?.(video.currentTime)
      requestAnimationFrame(progressLoop)
    }
  }

  function onTimeUpdate() {
    if (video.paused) {
      const currentProgress = (video.currentTime / video.duration) * 100
      setProgress(currentProgress)
      props.onProgress?.(video.currentTime)
    }
  }

  function onPlay() {
    requestAnimationFrame(progressLoop)
  }

  function togglePlay() {
    if (video.paused) {
      void video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  onMount(() => {
    const timeUpdate = () => props.onProgress?.(video.currentTime)
    video.addEventListener('timeupdate', timeUpdate)
    onCleanup(() => video.removeEventListener('timeupdate', timeUpdate))
    props.ref?.(video)
    video.addEventListener('loadedmetadata', () => {
      setDuration(video.duration)
    })
  })

  createEffect(() => {
    if (!streamUrl()) return
    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(streamUrl()!)
      hls.attachMedia(video)
      onCleanup(() => hls.destroy())
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl()!
    } else {
      console.error('Browser does not support hls')
    }
  })

  return (
    <div
      class={clsx(
        'relative flex aspect-[241/151] items-center justify-center self-stretch overflow-hidden rounded-t-md bg-surface-container-low',
        props.class,
      )}
    >
      <video
        ref={(el) => {
          video = el
          props.ref?.(el)
        }}
        class="absolute inset-0 size-full object-cover"
        autoplay
        muted
        onPlay={onPlay}
        onTimeUpdate={(e) => {
          onTimeUpdate()
          setCurrentTime(e.currentTarget.currentTime)
        }}
        loop
      />

      {/* Controls overlay */}
      <div class="absolute inset-0 flex items-end">
        {/* Controls background gradient */}
        <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Controls container */}
        <div class="relative flex w-full items-center gap-4 pb-4 pl-1">
          <button
            class="bg-surface-container-highest/80 flex size-8 items-center justify-center rounded-full text-on-surface hover:bg-surface-container-highest"
            onClick={togglePlay}
          >
            <Icon>{isPlaying() ? 'pause' : 'play_arrow'}</Icon>
          </button>

          <div class="font-mono text-sm text-on-surface">
            {formatDuration(currentTime())} / {formatDuration(duration())}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div class="absolute inset-x-0 bottom-0 h-2 bg-surface-container-high">
        <div 
          class="h-full bg-yellow-400 transition-[width]" 
          style={{ width: `${progress()}%` }}
        />
      </div>
    </div>
  )
}

export default RouteVideoPlayer
