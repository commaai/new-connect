import { Show } from 'solid-js'
import { Navigate, useNavigate, useSearchParams } from '@solidjs/router'

import { refreshAccessToken } from '~/api/auth/client'

type AuthParams = {
  code: string
  provider: string
}

export default function Auth() {
  const navigate = useNavigate()
  const [{ code, provider }] = useSearchParams<AuthParams>()

  if (code && provider) {
    refreshAccessToken(code, provider).then(() => {
      navigate('/')
    })
  }

  return (
    <Show when={code && provider} fallback={<Navigate href="/login" />} keyed>
      <h1>Authenticating...</h1>
    </Show>
  )
}
