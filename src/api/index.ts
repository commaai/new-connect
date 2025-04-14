import { accessToken } from './auth/client'
import { API_URL } from './config'

export async function fetcher<T>(endpoint: string, init?: RequestInit, apiUrl: string = API_URL): Promise<T> {
  const req = new Request(`${apiUrl}${endpoint}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `JWT ${accessToken()}`,
    },
  })
  const res = await fetch(req)
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`${req.method} ${req.url} ${res.status}`, { cause: res })
  }
  // biome-ignore lint/suspicious/noImplicitAnyLet: TODO: validate server response
  let json
  try {
    json = await JSON.parse(text)
  } catch (err) {
    throw new Error('Failed to parse response from server', { cause: err })
  }
  if (json.error) {
    throw new Error(`Server error: ${json.description}`, { cause: json })
  }
  return json
}
