import Button from '~/components/material/Button'

export default function OfflinePage() {
  return (
    <div class="flex min-h-screen flex-col gap-12 items-center justify-center bg-background p-6">
      <div class="flex max-w-sm flex-col items-center gap-4">
        <img src="/images/logo-connect-light.svg" alt="comma connect" width={96} height={96} />
        <div class="flex flex-col gap-2 items-center">
          <h1 class="text-2xl">comma connect</h1>
          <div class="flex items-center gap-3">
            <span class="size-2 rounded-full bg-error-container" />
            <p class="text-lg">offline</p>
          </div>
        </div>
      </div>
      <p class="text-md">Please check your network connection</p>
      <Button variant="tonal" onClick={() => window.location.reload()}>
        Try again
      </Button>
    </div>
  )
}
