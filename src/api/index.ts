import { getAccessToken } from './auth/client'
import { BASE_URL } from './config'

const populateFetchedAt = <T>(item: T): T => {
  return {
    ...item,
    fetched_at: Math.floor(Date.now() / 1000),
  }
}

export async function fetcher<T>(endpoint: string, init?: RequestInit, apiUrl: string = BASE_URL): Promise<T> {
  const res = await fetch(`${apiUrl}${endpoint}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
      Authorization: `JWT ${getAccessToken()}`,
    },
  })
  const text = await res.text()
  // biome-ignore lint/suspicious/noImplicitAnyLet: TODO: validate server response
  let json
  try {
    json = (await JSON.parse(text)) as T & { error?: string; description?: string }
  } catch {
    throw new Error(`Error: ${res.status} ${res.statusText}`, { cause: text })
  }
  if (json.error) {
    throw new Error(json.description, { cause: res })
  }
  if (Array.isArray(json)) {
    return json.map(populateFetchedAt) as T
  } else if (typeof json === 'object') {
    return populateFetchedAt(json)
  } else {
    throw new Error(`Unexpected response type: ${typeof json}. Expected either type array or object.`)
  }
}
