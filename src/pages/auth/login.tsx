import { getGoogleAuthUrl, getAppleAuthUrl, getGitHubAuthUrl } from '~/api/auth'

import Typography from '~/components/material/Typography'

export default function Login() {
  return (
    <div class="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div class="flex max-w-sm flex-col items-center gap-8">
        <img
          src="/images/logo-connect-light.svg"
          alt="comma connect"
          width={96}
          height={96}
        />

        <div class="flex flex-col items-center gap-2">
          <Typography
            class="md:mt-4"
            variant="display-sm"
            weight="extra-bold"
            as="h1"
          >
            comma connect
          </Typography>

          <Typography variant="body-lg" as="p">
            Manage your openpilot experience.
          </Typography>
        </div>

        <div class="flex flex-col items-stretch gap-4 self-stretch">
          <md-filled-button
            class="h-16 gap-4"
            href={getGoogleAuthUrl()}
          >
            <img
              src="/images/logo-google.svg"
              alt=""
              slot="icon"
            />
            Sign in with Google
          </md-filled-button>
          <md-filled-button
            class="h-16 gap-5 pr-7"
            href={getAppleAuthUrl()}
          >
            <img
              src="/images/logo-apple.svg"
              alt=""
              slot="icon"
            />
            Sign in with Apple
          </md-filled-button>
          <md-filled-button
            class="h-16 gap-4"
            href={getGitHubAuthUrl()}
          >
            <img
              src="/images/logo-github.svg"
              alt=""
              slot="icon"
            />
            Sign in with GitHub
          </md-filled-button>
        </div>

        <div class="flex justify-between gap-4">
          <Typography variant="body-lg" as="p">
            Make sure to sign in with the same account if you have previously
            paired your comma three.
          </Typography>

          <img
            src="/images/icon-comma-three-light.svg"
            alt=""
            width={32}
            height={32}
          />
        </div>
      </div>
    </div>
  )
}
