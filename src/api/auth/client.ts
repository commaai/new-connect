import { BASE_URL } from '../config'

const AUTH_KEY = 'ai.comma.api.authorization'

export async function refreshAccessToken(
  code: string,
  provider: string,
): Promise<void> {
  try {
    const resp = await fetch(`${BASE_URL}/v2/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ code, provider }),
    })

    if (!resp.ok) {
      throw new Error(`${resp.status}: ${await resp.text()}`)
    }

    const json = await resp.json()
    if (!json.access_token) {
      throw new Error('unknown error')
    }

    setAccessToken(json.access_token)
  } catch (e) {
    throw new Error(`Could not exchange oauth code for access token: ${e}`)
  }
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return window.localStorage.getItem(AUTH_KEY)
}

export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(AUTH_KEY, token)
}

export function clearAccessToken(): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.removeItem(AUTH_KEY)
}

export function isSignedIn(): boolean {
  return !!getAccessToken()
}

export function signOut(): void {
  clearAccessToken()
}
