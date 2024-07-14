import { WithFetchedAt } from '~/types'
import { getAccessToken } from './auth/client'
import { BASE_URL } from './config'

const populateFetchedAt = <T>(item: T): WithFetchedAt<T> => {
  return {
    ...item,
    fetched_at: Math.floor(Date.now() / 1000),
  }
}

export async function fetcher<T>(endpoint: string): Promise<WithFetchedAt<T>> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `JWT ${getAccessToken()}`,
    },
  })
  // TODO: validate responses
  const json = await res.json() as T & { error?: string; description?: string }
  if (json.error) {
    throw new Error(json.description)
  }
  if (Array.isArray(json)) {
    return json.map(populateFetchedAt) as WithFetchedAt<T>
  } else if (typeof json === 'object') {
    return populateFetchedAt(json)
  } else {
    throw new Error(`Unexpected response type: ${typeof json}. Expected either type array or object.`)
  }
}
