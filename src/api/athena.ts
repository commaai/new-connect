import { AthenaCallResponse, BackendAthenaCallResponse, BackendAthenaCallResponseError } from '~/api/types'
import { fetcher } from '.'
import { ATHENA_URL } from './config'

export const getNetworkMetered = (dongleId: string) => makeAthenaCall<void, boolean>(dongleId, 'getNetworkMetered')

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
