import { getGoogleAuthUrl, getAppleAuthUrl, getGitHubAuthUrl } from '~/api/auth'
import { setAccessToken } from '~/api/auth/client'
import * as Demo from '~/api/auth/demo'
import BuildInfo from '~/components/BuildInfo'

import Button from '~/components/material/Button'
import Icon from '~/components/material/Icon'

export default function Login() {
  const loginAsDemoUser = () => {
    setAccessToken(Demo.ACCESS_TOKEN)
    window.location.href = window.location.origin
  }

  return (
    <div class="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div class="flex max-w-sm flex-col items-center gap-8">
        <img src="/images/logo-connect-light.svg" alt="comma connect" width={96} height={96} />

        <div class="flex flex-col items-center gap-2 text-center">
          <h1 class="text-2xl font-extrabold md:mt-4">comma connect</h1>
          <p class="text-md">Manage your openpilot experience.</p>
        </div>

        <div class="flex flex-col items-stretch gap-4 self-stretch">
          <Button
            class="h-14 gap-4 xs:h-16"
            href={getGoogleAuthUrl()}
            leading={<img src="/images/logo-google.svg" alt="" width={32} height={32} />}
          >
            Sign in with Google
          </Button>
          <Button
            class="h-14 gap-4 xs:h-16"
            href={getAppleAuthUrl()}
            leading={<img src="/images/logo-apple.svg" alt="" width={32} height={32} />}
          >
            Sign in with Apple&nbsp&nbsp
          </Button>
          <Button
            class="h-14 gap-4 xs:h-16"
            href={getGitHubAuthUrl()}
            leading={<img src="/images/logo-github.svg" alt="" width={32} height={32} />}
          >
            Sign in with GitHub
          </Button>
        </div>

        <div class="flex justify-between gap-4">
          <p class="text-sm xs:text-md">Make sure to sign in with the same account if you have previously paired your comma three.</p>

          <img src="/images/icon-comma-three-light.svg" alt="" width={32} height={32} />
        </div>

        <Button onclick={loginAsDemoUser} trailing={<Icon name="chevron_right" />}>
          Try the demo
        </Button>
      </div>

      <BuildInfo class="absolute bottom-4" />
    </div>
  )
}
