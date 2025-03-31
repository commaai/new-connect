import { createMutation, queryOptions, useQueryClient } from '@tanstack/solid-query'
import {
  AthenaCallResponse,
  BackendAthenaCallResponse,
  BackendAthenaCallResponseError,
  CancelUploadRequest,
  CancelUploadResponse,
  DecoratedUploadQueueItem,
  UploadFile,
  UploadFilesToUrlsRequest,
  UploadFilesToUrlsResponse,
  UploadQueueItem,
} from '~/types'
import { fetcher } from '.'
import { ATHENA_URL } from './config'
import { parseUploadPath } from '~/utils/parse'

// Higher number is lower priority
export const COMMA_CONNECT_PRIORITY = 1

// Uploads expire after 1 week if device remains offline
const EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7

const transformUploadQueueToDecoratedUploadQueueItems = (data: AthenaCallResponse<UploadQueueItem[]>): DecoratedUploadQueueItem[] =>
  data.result?.map((item) => ({ ...item, ...parseUploadPath(item.url) })) || []

export const athena = {
  prefix: ['athena'],
  uploadQueue: () => [...athena.prefix, 'upload_queue'],
  uploadQueueForDongle: (dongleId: string) => [...athena.uploadQueue(), dongleId],
  getUploadQueue: (dongleId: string) =>
    queryOptions({
      queryKey: athena.uploadQueueForDongle(dongleId),
      queryFn: () => makeAthenaCall<void, UploadQueueItem[]>(dongleId, 'listUploadQueue'),
      select: transformUploadQueueToDecoratedUploadQueueItems,
    }),
  cancelUpload: (dongleId: string) => {
    const queryClient = useQueryClient()
    return createMutation(() => ({
      mutationFn: (ids: string[]) =>
        makeAthenaCall<CancelUploadRequest, CancelUploadResponse>(dongleId, 'cancelUpload', { upload_id: ids }),
      onSettled: () => queryClient.invalidateQueries({ queryKey: athena.uploadQueueForDongle(dongleId) }),
    }))
  },
}

export const getNetworkMetered = (dongleId: string) => makeAthenaCall<void, boolean>(dongleId, 'getNetworkMetered')

export const uploadFilesToUrls = (dongleId: string, files: UploadFile[]) =>
  makeAthenaCall<UploadFilesToUrlsRequest, UploadFilesToUrlsResponse>(
    dongleId,
    'uploadFilesToUrls',
    {
      files_data: files.map((file) => ({
        allow_cellular: false,
        fn: file.filePath,
        headers: file.headers,
        priority: COMMA_CONNECT_PRIORITY,
        url: file.url,
      })),
    },
    Math.floor(Date.now() / 1000) + EXPIRES_IN_SECONDS,
  )

export const setRouteViewed = (dongleId: string, route: string) =>
  makeAthenaCall<{ route: string }, void>(dongleId, 'setRouteViewed', { route })

export const makeAthenaCall = async <REQ, RES>(
  dongleId: string,
  method: string,
  params?: REQ,
  expiry?: number,
): Promise<AthenaCallResponse<RES>> => {
  const res = await fetcher<BackendAthenaCallResponse<RES> | BackendAthenaCallResponseError>(
    `/${dongleId}`,
    {
      method: 'POST',
      body: JSON.stringify({ id: 0, jsonrpc: '2.0', method, params, expiry }),
      headers: { 'Content-Type': 'application/json' },
    },
    ATHENA_URL,
  )
  if ('error' in res) {
    return { queued: false, error: res.error, result: undefined }
  }
  if (typeof res.result === 'string' && res.result === 'Device offline, message queued') {
    return { queued: true, error: undefined, result: undefined }
  }
  return { queued: false, error: undefined, result: res.result as RES }
}
