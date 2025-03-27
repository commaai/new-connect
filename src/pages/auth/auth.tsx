import { createSignal, Show } from 'solid-js'
import { Navigate, useNavigate, useSearchParams } from '@solidjs/router'

import { refreshAccessToken } from '~/api/auth/client'
import Button from '~/components/material/Button'
import Icon from '~/components/material/Icon'

type AuthParams = {
  code: string
  provider: string
}

export default function Auth() {
  const navigate = useNavigate()
  const [params] = useSearchParams<AuthParams>()
  const [error, setError] = createSignal<string | null>(null)

  const { code, provider } = params
  if (code && provider) {
    void refreshAccessToken(code, provider)
      .then(() => navigate('/'))
      .catch((err) => {
        console.error(err)
        if (err instanceof Error && err.message) {
          setError(err.message)
        } else {
          setError('Something went wrong')
        }
      })
  }

  return (
    <Show when={code && provider} fallback={<Navigate href="/login" />} keyed>
      <div class="flex min-h-screen max-w-lg flex-col gap-8 items-center mx-auto justify-center text-on-background bg-background p-6">
        <div class="flex flex-col gap-4 items-center">
          <img src="/images/logo-connect-light.svg" alt="comma connect" width={96} height={96} />
          <h1 class="text-display-sm">comma connect</h1>
        </div>
        <Show
          when={error()}
          fallback={
            <div class="flex items-center gap-3">
              <Icon class="animate-spin" name="sync" size="24" />
              <p class="text-title-lg">authenticating</p>
            </div>
          }
        >
          <div class="flex gap-4 items-center">
            <Icon class="text-error shrink-0" name="error" size="24" />
            <span class="text-body-lg">{error()}</span>
          </div>
          <Button color="secondary" href="/login">
            Try again
          </Button>
        </Show>
      </div>
    </Show>
  )
}
