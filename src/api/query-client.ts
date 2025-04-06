import { QueryClient } from '@tanstack/solid-query'
import { queries as uploadQueue } from '~/components/UploadQueue'
import { queries as routes } from '~/pages/dashboard/activities/RouteActivity'

const pollingConfig = { retry: false, refetchInterval: 1000 }

export const getAppQueryClient = () => {
  const queryClient = new QueryClient()

  queryClient.setQueryDefaults(uploadQueue.online(), pollingConfig)
  queryClient.setQueryDefaults(uploadQueue.offline(), pollingConfig)
  queryClient.setQueryDefaults(routes.route, { refetchOnMount: false })

  return queryClient
}
