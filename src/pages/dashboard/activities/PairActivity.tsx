import { createEffect, onCleanup, onMount, type JSX, type VoidComponent } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { createMachine } from '@solid-primitives/state-machine'
import QrScanner from 'qr-scanner'

import { pairDevice } from '~/api/devices'
import Button from '~/components/material/Button'
import CircularProgress from '~/components/material/CircularProgress'
import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'

import './PairActivity.css'

const PairActivity: VoidComponent = () => {
  const state = createMachine<{
    scanning: {
      value: JSX.Element,
      to: 'pairing' | 'error'
    },
    pairing: {
      input: { pairToken: string },
      value: JSX.Element,
      to: 'error'
    },
    error: {
      input: { error: Error }
      value: JSX.Element,
      to: 'scanning'
    }
  }>({
    initial: 'scanning',
    states: {
      scanning(_input, to) {
        let videoRef: HTMLVideoElement
        let qrScanner: QrScanner

        onMount(() => {
          qrScanner = new QrScanner(
            videoRef,
            (result) => {
              qrScanner.destroy()
              to.pairing({ pairToken: result.data })
            },
            {
              highlightScanRegion: true,
              highlightCodeOutline: true,
            },
          )
          void qrScanner.start()
        })

        onCleanup(() => {
          try {
            qrScanner?.destroy()
          } catch (_) { /* empty */ }
        })

        return (
          <div id="video-container" class="absolute size-full overflow-hidden bg-black text-white">
            <video class="left-1/2 top-1/2 h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover" ref={videoRef!} />
            <div class="prose absolute inset-0 flex flex-col justify-between p-4">
              <div class="flex items-center">
                <h1 class="grow text-title-lg">Pair new device</h1>
                <IconButton href="/">close</IconButton>
              </div>
              <h2 class="text-center text-title-md">Use the viewfinder to scan the QR code on your device</h2>
            </div>
          </div>
        )
      },
      pairing(input, to) {
        const navigate = useNavigate()

        pairDevice(input.pairToken)
          .then((dongleId) => navigate(`/${dongleId}`))
          .catch((reason) => {
            let error
            if (reason instanceof Error) {
              error = reason
            } else {
              error = new Error('An unknown error occurred', { cause: reason })
            }
            console.error('Error pairing device', error, error.cause)
            to.error({ error })
          })

        return (
          <div class="flex flex-col items-center justify-center">
            <TopAppBar class="w-screen" trailing={<IconButton href="/">close</IconButton>}>
              Device pairing
            </TopAppBar>

            <CircularProgress class="m-4" color="primary" size={64} />

            <div>Pairing your device...</div>
          </div>
        )
      },
      error(input, to) {
        return (
          <div class="flex flex-col items-center justify-center gap-4">
            <TopAppBar class="w-screen" trailing={<IconButton href="/">close</IconButton>}>
              Device pairing
            </TopAppBar>

            <div>
              An error occurred: {input.error.message}
            </div>

            <Button color="primary" onClick={() => to.scanning()}>
              Retry
            </Button>
          </div>
        )
      },
    },
  })

  createEffect(() => {
    console.log({ state: state.type })
  })

  return <div>{state.value}</div>
}

export default PairActivity
