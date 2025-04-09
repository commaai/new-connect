import { QueryClient } from '@tanstack/solid-query'
import { queries as uploadQueue } from '~/components/UploadQueue'
import { queries as routes } from '~/pages/dashboard/activities/RouteActivity'
import { queries as devices } from '~/pages/dashboard/activities/DeviceActivity'
import { queries as dashboard } from '~/pages/dashboard/Dashboard'

const pollingConfig = { retry: false, refetchInterval: 1000 }

export const getAppQueryClient = () => {
  const queryClient = new QueryClient()

  queryClient.setQueryDefaults(uploadQueue.online(), pollingConfig)
  queryClient.setQueryDefaults(uploadQueue.offline(), pollingConfig)
  queryClient.setQueryDefaults(routes.route, { refetchOnMount: false })
  queryClient.setQueryDefaults(routes.statistics(), { refetchOnMount: false })
  queryClient.setQueryDefaults(routes.location(), { refetchOnMount: false })
  queryClient.setQueryDefaults(devices.device, { refetchOnMount: false })
  queryClient.setQueryDefaults(devices.allDevices(), { refetchOnMount: false })
  queryClient.setQueryDefaults(dashboard.profile, { refetchOnMount: false })

  return queryClient
}
