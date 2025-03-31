import {
  AthenaCallResponse,
  BackendAthenaCallResponse,
  BackendAthenaCallResponseError,
  UploadFile,
  UploadFilesToUrlsRequest,
  UploadFilesToUrlsResponse,
  UploadQueueItem,
} from '~/types'
import { fetcher } from '.'
import { ATHENA_URL } from './config'

// Higher number is lower priority
export const COMMA_CONNECT_PRIORITY = 1

// Uploads expire after 1 week if device remains offline
const EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7

export const getNetworkMetered = (dongleId: string) => makeAthenaCall<void, boolean>(dongleId, 'getNetworkMetered')
export const getUploadQueue = (dongleId: string) => makeAthenaCall<void, UploadQueueItem[]>(dongleId, 'listUploadQueue')
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
