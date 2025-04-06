import { QueryClient } from '@tanstack/solid-query'
import { queries as uploadQueue } from '~/components/UploadQueue'
import { queries as routes } from '~/pages/dashboard/activities/RouteActivity'

const dontRefetchOften = {
  staleTime: 1000 * 60 * 60, // 1 hour
  refetchOnMount: false,
  refetchOnWindowFocus: false,
}
const pollingConfig = { retry: false, refetchInterval: 1000 }
const useSuspense = { throwOnError: true }

export const getAppQueryClient = () => {
  const queryClient = new QueryClient()

  queryClient.setQueryDefaults(uploadQueue.online(), pollingConfig)
  queryClient.setQueryDefaults(uploadQueue.offline(), pollingConfig)
  queryClient.setQueryDefaults(routes.route(), { ...dontRefetchOften, ...useSuspense })

  return queryClient
}
