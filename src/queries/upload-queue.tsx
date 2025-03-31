import { createMutation, queryOptions, useQueryClient } from '@tanstack/solid-query'
import { fetcher } from '~/api'
import { makeAthenaCall } from '~/api/athena'
import { AthenaOfflineQueueResponse, UploadQueueItem } from '~/types'

export const uploadQueue = {
  prefix: ['upload_queue'],

  online: () => [...uploadQueue.prefix, 'online'],
  onlineForDongle: (dongleId: string) => [...uploadQueue.online(), dongleId],
  getOnline: (dongleId: string) =>
    queryOptions({
      queryKey: uploadQueue.onlineForDongle(dongleId),
      queryFn: () => makeAthenaCall<void, UploadQueueItem[]>(dongleId, 'listUploadQueue'),
    }),

  offline: () => [...uploadQueue.prefix, 'offline'],
  offlineForDongle: (dongleId: string) => [...uploadQueue.offline(), dongleId],
  getOffline: (dongleId: string) =>
    queryOptions({
      queryKey: uploadQueue.offlineForDongle(dongleId),
      queryFn: () => fetcher<AthenaOfflineQueueResponse>(`/v1/devices/${dongleId}/athena_offline_queue`),
    }),

  cancelUpload: (dongleId: string) => {
    const queryClient = useQueryClient()
    return createMutation(() => ({
      mutationFn: (ids: string[]) => makeAthenaCall(dongleId, 'cancelUpload', { upload_id: ids }),
      onSettled: () => queryClient.invalidateQueries({ queryKey: uploadQueue.onlineForDongle(dongleId) }),
    }))
  },
}
