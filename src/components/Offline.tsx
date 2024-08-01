import { ParentProps, createSignal, onCleanup, Show } from 'solid-js'
import Button from './material/Button'

const OfflineIndicator = (props: ParentProps) => {
  const [isOffline, setIsOffline] = createSignal(!navigator.onLine)

  const updateOnlineStatus = () => setIsOffline(!navigator.onLine)

  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)

  onCleanup(() => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
  })

  const handleTryAgain = () => window.location.reload()

  return <Show when={isOffline()} fallback={props.children}>
    <div class="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div class="flex max-w-sm flex-col items-center gap-8">
        <img
          src="/images/logo-connect-light.svg"
          alt="comma connect"
          width={96}
          height={96}
        />
        <div class="flex flex-col items-center gap-2">
          <h1 class="text-display-sm font-extrabold md:mt-4">comma connect</h1>
          <div class="flex items-center gap-2">
            <div class="size-2 rounded-full bg-red-500" />
            <p class="text-body-lg">offline</p>
          </div>
        </div>
        <div>
          <p class="text-center text-body-lg">
            Please check your internet connection
          </p>
          <p class="text-center text-body-lg">
            and try again.
          </p>
        </div>
        <Button
          class="gap-4"
          onclick={handleTryAgain}
          trailing={
            <span class="material-symbols-outlined icon-outline">
              refresh
            </span>
          }
        >
          Try Again
        </Button>
      </div>
    </div>
  </Show>
}

export default OfflineIndicator
