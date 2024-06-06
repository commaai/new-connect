import { getAccessToken } from './auth/client'
import { BASE_URL } from './config'

export async function fetcher<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `JWT ${getAccessToken()}`,
    },
  })

  const json = await res.json()
  if (json.error) {
    throw new Error(json.description)
  }
  return json
}
