import Button from '~/components/material/Button'

export default function Offline() {
  return (
    <div class="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div class="flex max-w-sm flex-col items-center gap-8">
        <img src="/images/logo-connect-light.svg" alt="comma connect" width={96} height={96} />
        Your device is offline
      </div>
      <Button onClick={() => window.location.reload()}>Reload</Button>
    </div>
  )
}
