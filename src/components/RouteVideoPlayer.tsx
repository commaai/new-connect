import { createEffect, createResource, createSignal, onCleanup, onMount, type VoidComponent } from 'solid-js'
import clsx from 'clsx'

import { getQCameraStreamUrl } from '~/api/route'
import Icon from '~/components/material/Icon'
import { formatVideoTime } from '~/utils/format'
import type Hls from '~/utils/hls'

type RouteVideoPlayerProps = {
  class?: string
  routeName: string
  startTime: number
  onProgress?: (seekTime: number) => void
  ref?: (el?: HTMLVideoElement) => void
}

const RouteVideoPlayer: VoidComponent<RouteVideoPlayerProps> = (props) => {
  const [streamUrl] = createResource(() => props.routeName, getQCameraStreamUrl)
  const [hls, setHls] = createSignal<Hls | null>()
  let video!: HTMLVideoElement

  const [isPlaying, setIsPlaying] = createSignal(true)
  const [progress, setProgress] = createSignal(0)
  const [currentTime, setCurrentTime] = createSignal(0)
  const [duration, setDuration] = createSignal(0)
  // const progress = () => {
  //   const total = duration()
  //   if (!total) return 0
  //   return (currentTime() / total) * 100
  // }

  const updateProgress = () => {
    const currentProgress = (video.currentTime / video.duration) * 100
    setProgress(currentProgress)
    props.onProgress?.(video.currentTime)
  }

  const updateProgressContinuously = () => {
    if (!video || video.paused) return
    updateProgress()
    requestAnimationFrame(updateProgressContinuously)
  }

  const startProgressTracking = () => {
    requestAnimationFrame(updateProgressContinuously)
  }

  const togglePlayback = () => {
    if (video.paused) {
      void video.play()
    } else {
      video.pause()
    }
  }

  onMount(() => {
    if (!Number.isNaN(props.startTime)) {
      video.currentTime = props.startTime
    }

    props.ref?.(video)

    const onTimeUpdate = (e: Event) => {
      setCurrentTime((e.currentTarget as HTMLVideoElement).currentTime)
      if (video.paused) updateProgress()
      props.onProgress?.(video.currentTime)
    }
    const onLoadedMetadata = () => {
      setDuration(video.duration)
      // if ('ontouchstart' in window) return
      // void video.play().catch(() => {})
    }
    const onPlay = () => {
      setIsPlaying(true)
      startProgressTracking()
    }
    const onPause = () => setIsPlaying(false)
    const onEnded = () => setIsPlaying(false)
    const onStalled = () => {
      if (isPlaying()) {
        void video.play()
      }
    }

    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnded)
    video.addEventListener('stalled', onStalled)

    onCleanup(() => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnded)
      video.removeEventListener('stalled', onStalled)
      props.ref?.(video)
    })

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
        'relative flex aspect-[241/151] items-center justify-center self-stretch overflow-hidden rounded-t-md bg-surface-container-low isolate',
        props.class,
      )}
    >
      {/* Video as background */}
      <div class="absolute inset-0 -z-10">
        <video
          ref={video}
          class="size-full object-cover"
          data-testid="route-video"
          autoplay
          muted
          controls={false}
          playsinline
          loop
          disablepictureinpicture
        />
      </div>

      {/* Controls overlay */}
      <div class="absolute inset-0 flex items-end">
        {/* Controls background gradient */}
        <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Controls container */}
        <div class="relative flex w-full items-center gap-4 pb-4 pl-1">
          <button
            class="bg-surface-container-highest/80 flex size-8 items-center justify-center rounded-full text-on-surface hover:bg-surface-container-highest"
            onClick={togglePlayback}
          >
            <Icon name={isPlaying() ? 'pause' : 'play_arrow'} />
          </button>

          <div class="font-mono text-sm text-on-surface">
            {formatVideoTime(currentTime())} / {formatVideoTime(duration())}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div class="absolute inset-x-0 bottom-0 h-1 bg-surface-container-high">
        <div class="h-full bg-yellow-400" style={{ width: `${progress()}%` }} />
      </div>
    </div>
  )
}

export default RouteVideoPlayer
