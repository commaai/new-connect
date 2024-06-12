import { getGoogleAuthUrl, getAppleAuthUrl, getGitHubAuthUrl } from '~/api/auth'
import { setAccessToken } from '~/api/auth/client'

import Button from '~/components/material/Button'
import Typography from '~/components/material/Typography'

export default function Login() {
  const loginAsDemoUser = function () {
    setAccessToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDg1ODI0NjUsIm5iZiI6MTcxNzA0NjQ2NSwiaWF0IjoxNzE3MDQ2NDY1LCJpZGVudGl0eSI6IjBkZWNkZGNmZGYyNDFhNjAifQ.g3khyJgOkNvZny6Vh579cuQj1HLLGSDeauZbfZri9jw');
    window.location.href = window.location.origin;
  };

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
          <Button
            class="h-16 gap-4"
            href={getGoogleAuthUrl()}
            leading={
              <img
                src="/images/logo-google.svg"
                alt=""
                width={32}
                height={32}
              />
            }
          >
            Sign in with Google
          </Button>
          <Button
            class="h-16 gap-5 pr-7"
            href={getAppleAuthUrl()}
            leading={
              <div class="relative size-8">
                <img
                  src="/images/logo-apple.svg"
                  alt=""
                  width="100%"
                  height="100%"
                  style={{ 'object-fit': 'contain' }}
                />
              </div>
            }
          >
            Sign in with Apple
          </Button>
          <Button
            class="h-16 gap-4"
            href={getGitHubAuthUrl()}
            leading={
              <img
                src="/images/logo-github.svg"
                alt=""
                width={32}
                height={32}
              />
            }
          >
            Sign in with GitHub
          </Button>
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

        <Button
          class="gap-4"
          onclick={loginAsDemoUser}
          trailing={
            <span class="material-symbols-outlined icon-outline">
              chevron_right
            </span>
          }
        >
          Try the demo
        </Button>
      </div>
    </div>
  )
}
