import { createMutation, queryOptions, useQueryClient } from '@tanstack/solid-query'
import { getUploadQueue, makeAthenaCall } from '~/api/athena'
import { getAthenaOfflineQueue } from '~/api/devices'

export const uploadQueue = {
  prefix: ['upload_queue'],

  online: () => [...uploadQueue.prefix, 'online'],
  onlineForDongle: (dongleId: string) => [...uploadQueue.online(), dongleId],
  getOnline: (dongleId: string) =>
    queryOptions({ queryKey: uploadQueue.onlineForDongle(dongleId), queryFn: () => getUploadQueue(dongleId) }),
  offline: () => [...uploadQueue.prefix, 'offline'],
  offlineForDongle: (dongleId: string) => [...uploadQueue.offline(), dongleId],
  getOffline: (dongleId: string) =>
    queryOptions({ queryKey: uploadQueue.offlineForDongle(dongleId), queryFn: () => getAthenaOfflineQueue(dongleId) }),
  cancelUpload: (dongleId: string) => {
    const queryClient = useQueryClient()
    return createMutation(() => ({
      mutationFn: (ids: string[]) => makeAthenaCall(dongleId, 'cancelUpload', { upload_id: ids }),
      onSettled: () => queryClient.invalidateQueries({ queryKey: uploadQueue.onlineForDongle(dongleId) }),
    }))
  },
}
