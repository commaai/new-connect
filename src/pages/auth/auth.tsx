import { createEffect, Show } from 'solid-js'
import { Navigate, useNavigate, useSearchParams } from '@solidjs/router'

import { refreshAccessToken } from '~/api/auth/client'

type AuthParams = {
  code: string
  provider: string
}

export default function Auth() {
  const navigate = useNavigate()
  const [params] = useSearchParams<AuthParams>()
  const { code, provider } = params

  console.log('auth', { code, provider })
  createEffect(() => {
    console.log('effect', { ...params })
  })

  if (code && provider) {
    void refreshAccessToken(code, provider).then(() => {
      navigate('/')
    })
  }

  return (
    <Show when={code && provider} fallback={<Navigate href="/login" />} keyed>
      <h1>Authenticating...</h1>
    </Show>
  )
}
