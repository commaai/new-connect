import { getAccessToken } from './auth/client'
import { BASE_URL } from './config'

const populateFetchedAt = <T>(item: T): T => {
  return {
    ...item,
    fetched_at: Math.floor(Date.now() / 1000),
  }
}

export async function fetcher<T>(endpoint: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `JWT ${getAccessToken()}`,
    },
  })
  // TODO: validate responses
  const json = await res.json() as T & { error?: string; description?: string }
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
