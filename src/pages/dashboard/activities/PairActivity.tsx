import { onCleanup, onMount, type JSX, type VoidComponent } from 'solid-js'
import { useLocation, useNavigate } from '@solidjs/router'
import { createMachine } from '@solid-primitives/state-machine'
import QrScanner from 'qr-scanner'

import { pairDevice } from '~/api/devices'
import Button from '~/components/material/Button'
import Icon from '~/components/material/Icon'
import IconButton from '~/components/material/IconButton'
import { useHeader } from '~/components/AppHeader'

import './PairActivity.css'

const toError = (error: unknown): Error => {
  if (error instanceof Error) return error
  if (typeof error === 'string') return new Error(error)
  return new Error('An unknown error occurred', { cause: error })
}

const PairActivity: VoidComponent<{ onPaired: () => void }> = (props) => {
  const { pair } = useLocation().query
  const pairToken: string | undefined = Array.isArray(pair) ? pair[0] : pair
  const { updateState } = useHeader()

  const state = createMachine<{
    scanning: {
      value: JSX.Element
      to: 'pairing' | 'error'
    }
    pairing: {
      input: { pairToken: string }
      value: JSX.Element
      to: 'error'
    }
    error: {
      input: { error: Error }
      value: JSX.Element
      to: 'scanning'
    }
  }>({
    initial: pairToken
      ? {
          type: 'pairing',
          input: { pairToken },
        }
      : 'scanning',
    states: {
      scanning(_input, to) {
        let videoRef!: HTMLVideoElement

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

        // Update header for scanning state
        updateState({
          variant: 'modal',
          title: 'Add new device',
          trailing: <IconButton name="close" href="/" />,
        })

        return (
          <div id="video-container" class="fixed inset-0 bg-black text-white">
            <video class="absolute inset-0 size-full object-cover" ref={videoRef} />
            <div class="prose absolute inset-0 flex flex-col justify-between pb-7">
              <h2 class="px-8 text-center text-md">Use the viewfinder to scan the QR code on your device</h2>
            </div>
          </div>
        )
      },
      pairing(input, to) {
        const navigate = useNavigate()

        // Update header for pairing state
        updateState({
          variant: 'modal',
          title: 'Add new device',
        })

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
            <div class="flex flex-col items-center gap-4">
              <Icon name="autorenew" class="animate-spin" size="40" />
              <span class="text-md">Pairing your device...</span>
            </div>
          </>
        )
      },
      error(input, to) {
        // Update header for error state
        updateState({
          variant: 'modal',
          title: 'Add new device',
          trailing: <IconButton name="close" href="/" />,
        })

        return (
          <>
            <div class="flex flex-col items-center gap-4 px-4 max-w-sm mx-auto">
              An error occurred: {input.error.message}
              <Button color="primary" onClick={() => to.scanning()}>
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
