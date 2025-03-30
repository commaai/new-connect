import { http, HttpResponse } from 'msw'

import { API_URL } from '~/api/config'
import type { Profile } from '~/types'

export const handlers = [
  http.get(`${API_URL}/v1/me`, () => {
    return HttpResponse.json<Profile>({
      id: '0123456789abcdef',
      email: 'user@comma.ai',
      regdate: 1735689600,
      superuser: true,
      user_id: 'google_0123456789abcdef',
    })
  }),
]
