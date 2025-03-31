import { QueryClient } from '@tanstack/solid-query'
import { uploadQueue } from '~/queries/upload-queue'

const pollingConfig = { retry: false, refetchInterval: 1000 }

export const getAppQueryClient = () => {
  const queryClient = new QueryClient()

  queryClient.setQueryDefaults(uploadQueue.online(), pollingConfig)
  queryClient.setQueryDefaults(uploadQueue.offline(), pollingConfig)

  return queryClient
}
