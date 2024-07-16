import { onCleanup, onMount, type VoidComponent } from 'solid-js'
import QrScanner from 'qr-scanner'

import IconButton from '~/components/material/IconButton'

import './PairActivity.css'

const PairActivity: VoidComponent = () => {
  let qrScanner: QrScanner
  let videoRef: HTMLVideoElement

  onMount(() => {
    qrScanner = new QrScanner(
      videoRef,
      (result) => {
        console.debug('Decoded QR:', result.data)
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      },
    )
    void qrScanner.start()
  })

  onCleanup(() => {
    qrScanner.destroy()
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
}

export default PairActivity