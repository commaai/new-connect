import { QueryClient } from '@tanstack/solid-query'

export const ONLINE_QUEUE = 'online_queue'
export const OFFLINE_QUEUE = 'offline_queue'

export const getAppQueryClient = () => {
  const queryClient = new QueryClient()

  const pollingConfig = { retry: false, refetchInterval: 1000 }
  queryClient.setQueryDefaults([ONLINE_QUEUE], pollingConfig)
  queryClient.setQueryDefaults([OFFLINE_QUEUE], pollingConfig)

  return queryClient
}
