import { createEffect, createResource, createSignal, onCleanup, onMount, Show, type VoidComponent } from 'solid-js'
import clsx from 'clsx'

import { getQCameraStreamUrl } from '~/api/route'
import IconButton from '~/components/material/IconButton'
import { formatVideoTime } from '~/utils/format'
import type Hls from '~/utils/hls'
import Icon from './material/Icon'

type RouteVideoPlayerProps = {
  class?: string
  onError?: () => void
  onLoad?: () => void
  onProgress: (seekTime: number) => void
  ref: (el?: HTMLVideoElement) => void
  routeName: string
  startTime: number
}

const RouteVideoPlayer: VoidComponent<RouteVideoPlayerProps> = (props) => {
  const [streamUrl] = createResource(() => props.routeName, getQCameraStreamUrl)
  const [hls, setHls] = createSignal<Hls | null>()
  let video!: HTMLVideoElement
  let controls!: HTMLDivElement

  const [isErrored, setErrored] = createSignal(false)
  const [isPlaying, setIsPlaying] = createSignal(true)
  const [currentTime, setCurrentTime] = createSignal(0)
  const [duration, setDuration] = createSignal(0)
  const [videoLoading, setVideoLoading] = createSignal(true)

  createEffect(() => {
    props.routeName // track changes
    setVideoLoading(true)
  })

  const onLoadedData = () => setVideoLoading(false)
  const updateProgress = () => props.onProgress?.(video.currentTime)
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
  const onClick = (e: Event) => {
    e.preventDefault()
    togglePlayback()
  }

  const onTimeUpdate = (e: Event) => {
    setCurrentTime((e.currentTarget as HTMLVideoElement).currentTime)
    if (video.paused) updateProgress()
  }
  const onError = () => props.onError?.() && setErrored(true)
  const onLoad = () => props.onLoad?.() && setErrored(false)

  const onLoadedMetadata = () => setDuration(video.duration)
  const onPlay = () => {
    setIsPlaying(true)
    startProgressTracking()
  }
  const onPause = () => setIsPlaying(false)
  const onEnded = () => setIsPlaying(false)
  const onStalled = () => {
    if (!isPlaying()) return
    void video.play()
  }

  onMount(() => {
    if (!Number.isNaN(props.startTime)) {
      video.currentTime = props.startTime
    }

    props.ref?.(video)

    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onEnded)
    video.addEventListener('stalled', onStalled)
    video.addEventListener('loadeddata', onLoadedData)

    onCleanup(() => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onEnded)
      video.removeEventListener('stalled', onStalled)
      video.removeEventListener('loadeddata', onLoadedData)
      props.ref?.(video)
    })

    createEffect(() => {
      console.log(isErrored())
      if (isErrored()) return
      controls.addEventListener('click', onClick)
      onCleanup(() => controls.removeEventListener('click', onClick))
    })

    if ('MediaSource' in window) {
      import('~/utils/hls').then((Hls) => {
        const player = Hls.createHls()

        const { Events, ErrorTypes } = Hls.default
        player.on(Events.ERROR, (_, data) => {
          if (!data.fatal) return
          if (data.type === ErrorTypes.NETWORK_ERROR) onError()
        })
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
    if (!url || player === undefined) {
      onError()
    } else {
      if (player) {
        player.loadSource(url)
      } else {
        video.src = url
      }
      onLoad()
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

      {/* Loading animation */}
      <Show when={videoLoading()}>
        <div class="absolute inset-0 z-0 skeleton-loader" />
      </Show>

      {/* Controls overlay */}
      <Show
        when={!isErrored()}
        fallback={
          <div class="flex flex-col items-center gap-2">
            <Icon name="satellite_alt" />
            <span class="w-[66%] text-center text-wrap">This video segment has not uploaded yet or has been deleted.</span>
          </div>
        }
      >
        <div class="absolute inset-0 flex items-end" ref={controls}>
          {/* Controls background gradient */}
          <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Controls container */}
          <div class="relative flex w-full items-center gap-3 pb-3 px-2">
            <IconButton name={isPlaying() ? 'pause' : 'play_arrow'} filled />

            <div class="font-mono text-sm text-on-surface">
              {formatVideoTime(currentTime())} / {formatVideoTime(duration())}
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}

export default RouteVideoPlayer
