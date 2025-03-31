import { createMutation, queryOptions, useQueryClient } from '@tanstack/solid-query'
import { fetcher } from '~/api'
import { makeAthenaCall } from '~/api/athena'
import { AthenaCallResponse, AthenaOfflineQueueResponse, UploadFilesToUrlsRequest, UploadQueueItem } from '~/types'

const mapOnlineQueueItems = (data: AthenaCallResponse<UploadQueueItem[]>) => data.result?.sort((a, b) => b.progress - a.progress) || []
const mapOfflineQueueItems = (data: AthenaOfflineQueueResponse): UploadQueueItem[] =>
  data
    .filter((item) => item.method === 'uploadFilesToUrls')
    .flatMap((item) =>
      (item.params as UploadFilesToUrlsRequest).files_data.map((file) => ({
        ...file,
        path: file.fn,
        created_at: 0,
        current: false,
        id: '',
        progress: 0,
        retry_count: 0,
      })),
    )

export const uploadQueue = {
  prefix: ['upload_queue'],

  online: () => [...uploadQueue.prefix, 'online'],
  onlineForDongle: (dongleId: string) => [...uploadQueue.online(), dongleId],
  getOnline: (dongleId: string) =>
    queryOptions({
      queryKey: uploadQueue.onlineForDongle(dongleId),
      queryFn: () => makeAthenaCall<void, UploadQueueItem[]>(dongleId, 'listUploadQueue'),
      select: mapOnlineQueueItems,
    }),

  offline: () => [...uploadQueue.prefix, 'offline'],
  offlineForDongle: (dongleId: string) => [...uploadQueue.offline(), dongleId],
  getOffline: (dongleId: string) =>
    queryOptions({
      queryKey: uploadQueue.offlineForDongle(dongleId),
      queryFn: () => fetcher<AthenaOfflineQueueResponse>(`/v1/devices/${dongleId}/athena_offline_queue`),
      select: mapOfflineQueueItems,
    }),

  cancelUpload: (dongleId: string) => {
    const queryClient = useQueryClient()
    return createMutation(() => ({
      mutationFn: (ids: string[]) => makeAthenaCall(dongleId, 'cancelUpload', { upload_id: ids }),
      onSettled: () => queryClient.invalidateQueries({ queryKey: uploadQueue.onlineForDongle(dongleId) }),
    }))
  },
}
