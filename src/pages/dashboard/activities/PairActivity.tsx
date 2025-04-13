import { createEffect, createSignal, on, onCleanup, onMount, Show, type JSX, type VoidComponent } from 'solid-js'
import { useLocation, useNavigate } from '@solidjs/router'
import { createMachine } from '@solid-primitives/state-machine'
import QrScanner from 'qr-scanner'
import clsx from 'clsx'

import { pairDevice } from '~/api/devices'
import Button from '~/components/material/Button'
import Icon from '~/components/material/Icon'
import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'

import './PairActivity.css'

const toError = (error: unknown): Error => {
  if (error instanceof Error) return error
  if (typeof error === 'string') return new Error(error)
  return new Error('An unknown error occurred', { cause: error })
}

/**
 * @see https://github.com/solidjs-community/solid-primitives/blob/main/packages/permission/src/index.ts#L10
 */
const createPermission = (name: PermissionName) => {
  const [permission, setPermission] = createSignal<PermissionState | 'unknown'>('unknown')
  const [status, setStatus] = createSignal<PermissionStatus>()

  navigator.permissions
    .query({ name })
    .then(setStatus)
    .catch((error) => {
      if (error.name !== 'TypeError') return
      // firefox will not allow us to read media permissions,
      // so we need to wrap getUserMedia in order to get them:
      // TODO: only set to prompt if devices are available
      setPermission('prompt')
      const constraint = 'video'
      const getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
      navigator.mediaDevices.getUserMedia = (constraints) =>
        constraints?.[constraint]
          ? getUserMedia(constraints)
              .then((stream) => {
                setPermission('granted')
                return stream
              })
              .catch((error) => {
                if (/not allowed/.test(error.message)) {
                  setPermission('denied')
                }
                return Promise.reject(error)
              })
          : getUserMedia(constraints)
    })
  createEffect(
    on(status, (status) => {
      if (!status) return
      setPermission(status.state)
      const listener = () => setPermission(status.state)
      status.addEventListener('change', listener)
      onCleanup(() => status.removeEventListener('change', listener))
    }),
  )

  return permission
}

/**
 * Create a media request that will be stopped immediately in order to request permissions from the user
 * @see https://github.com/solidjs-community/solid-primitives/blob/main/packages/stream/src/index.ts#L291
 */
const createMediaPermissionRequest = async (source: MediaStreamConstraints) => {
  const stream = await navigator.mediaDevices.getUserMedia(source)
  stream.getTracks().forEach((track) => track.stop())
}

const PairActivity: VoidComponent<{ onPaired: () => void }> = (props) => {
  const { pair } = useLocation().query
  const pairToken: string | undefined = Array.isArray(pair) ? pair[0] : pair

  const permission = createPermission('camera')
  const state = createMachine<{
    grant: {
      value: JSX.Element
      to: 'scanning' | 'error'
    }
    scanning: {
      value: JSX.Element
      to: 'grant' | 'pairing' | 'error'
    }
    pairing: {
      input: { pairToken: string }
      value: JSX.Element
      to: 'error'
    }
    error: {
      input: { error: Error }
      value: JSX.Element
      to: 'grant'
    }
  }>({
    initial: pairToken
      ? {
          type: 'pairing',
          input: { pairToken },
        }
      : 'grant',
    states: {
      grant(_input, to) {
        createEffect(() => {
          console.debug('permission', permission())
          if (permission() === 'granted') {
            to.scanning()
          } else if (permission() === 'prompt') {
            void createMediaPermissionRequest({ video: true })
              .then(() => {
                to.scanning()
              })
              .catch((reason) => {
                const error = toError(reason)
                console.error('Failed to request permission', error)
                to.error({ error })
              })
          }
        })
        return (
          <>
            <TopAppBar trailing={<IconButton name="close" href="/" />}>Add new device</TopAppBar>
            <div class={clsx('flex flex-col items-center text-center gap-4 px-8 max-w-xs mx-auto text-md')}>
              <Icon name="camera" size="40" />
              <Show when={permission() === 'denied'} fallback="Please grant connect permission to use your camera">
                Camera permission denied - check your browser settings
              </Show>
            </div>
          </>
        )
      },
      scanning(_input, to) {
        let videoRef!: HTMLVideoElement

        createEffect(() => {
          if (permission() !== 'granted') to.grant()
        })
        onMount(() => {
          const qrScanner = new QrScanner(
            videoRef,
            (result) => {
              qrScanner.destroy()
              to.pairing({ pairToken: result.data })
            },
            {
              highlightScanRegion: true,
            },
          )
          void qrScanner.start().catch((reason) => {
            const error = toError(reason)
            console.error('Error starting QR scanner', error, error.cause)
            to.error({ error })
          })
          onCleanup(() => {
            try {
              qrScanner.destroy()
            } catch (_) {}
          })
        })

        return (
          <div id="video-container" class="fixed inset-0 bg-black text-white">
            <video class="absolute inset-0 size-full object-cover" ref={videoRef} />
            <div class="prose absolute inset-0 flex flex-col justify-between pb-7">
              <TopAppBar trailing={<IconButton name="close" href="/" />}>Add new device</TopAppBar>
              <h2 class="px-8 text-center text-md">Use the viewfinder to scan the QR code on your device</h2>
            </div>
          </div>
        )
      },
      pairing(input, to) {
        const navigate = useNavigate()

        pairDevice(input.pairToken)
          .then((dongleId) => navigate(`/${dongleId}`))
          .then(props.onPaired)
          .catch((reason) => {
            const error = toError(reason)
            console.error('Error pairing device', error, error.cause)
            to.error({ error })
          })

        return (
          <>
            <TopAppBar>Add new device</TopAppBar>

            <div class="flex flex-col items-center gap-4">
              <Icon name="autorenew" class="animate-spin" size="40" />
              <span class="text-md">Pairing your device...</span>
            </div>
          </>
        )
      },
      error(input, to) {
        return (
          <>
            <TopAppBar trailing={<IconButton name="close" href="/" />}>Add new device</TopAppBar>

            <div class="flex flex-col items-center gap-4">
              An error occurred: {input.error.message}
              <Button color="primary" onClick={() => to.grant()}>
                Retry
              </Button>
            </div>
          </>
        )
      },
    },
  })

  return <div>{state.value}</div>
}

export default PairActivity
