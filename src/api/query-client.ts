import { QueryClient } from '@tanstack/solid-query'
import { athena } from '~/api/athena'
import { devices } from '~/api/devices'

const pollingConfig = { retry: false, refetchInterval: 1000 }

export const getAppQueryClient = () => {
  const queryClient = new QueryClient()

  queryClient.setQueryDefaults(athena.uploadQueue(), pollingConfig)
  queryClient.setQueryDefaults(devices.offlineQueue(), pollingConfig)

  return queryClient
}
