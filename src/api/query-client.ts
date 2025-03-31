import { QueryClient } from '@tanstack/solid-query'
import { AthenaQueryKeys } from '~/api/athena'
import { DeviceQueryKeys } from '~/api/devices'

const pollingConfig = { retry: false, refetchInterval: 1000 }

export const getAppQueryClient = () => {
  const queryClient = new QueryClient()

  queryClient.setQueryDefaults(AthenaQueryKeys.uploadQueue, pollingConfig)
  queryClient.setQueryDefaults(DeviceQueryKeys.offlineQueue, pollingConfig)

  return queryClient
}
