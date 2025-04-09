import type { Profile } from '~/api/types'

import { fetcher } from '.'

export const getProfile = async () => fetcher<Profile>('/v1/me/')
