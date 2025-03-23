import { createSignal, createMemo, onCleanup, onMount } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'
import { cancelUpload, getUploadQueue } from '~/api/athena'
import { getAthenaOfflineQueue } from '~/api/devices'
import type { UploadItem } from '~/types'
import { UploadQueueItem as AthenaOnlineUploadQueueItem, AthenaOfflineQueueItem } from '~/types'

const processOfflineQueueData = (data: AthenaOfflineQueueItem[]): UploadItem[] =>
  data.flatMap(item =>
    item.params.files_data.map(file => ({
      id: file.fn,
      name: file.url.split('/').pop() || file.fn,
      uploadUrl: file.url,
      progress: 0,
      priority: file.priority,
      retryCount: 0,
      status: getUploadStatus(item)
    }))
  )

const mapQueueData = (data: AthenaOnlineUploadQueueItem[]): UploadItem[] =>
  data.map(item => ({
    id: item.id,
    name: item.path.split('/').pop() || item.path,
    uploadUrl: item.url,
    progress: item.progress,
    priority: item.priority,
    retryCount: item.retry_count,
    status: getUploadStatus(item)
  }))

const getUploadStatus = (item: AthenaOnlineUploadQueueItem | AthenaOfflineQueueItem): UploadItem['status'] => {
  if ('current' in item) {
    if (Math.round(item.progress * 100) === 100) return 'completed'
    if (item.current) return 'uploading'
    if (item.retry_count > 0) return 'error'
    return 'pending'
  }
  return 'waiting_for_network'
}

const clearQueue = async (dongleId: string, items: UploadItem[]) => {
  try {
    await cancelUpload(dongleId, items.map(item => item.id))
  } catch (err) {
    console.error('Error clearing queue:', err)
  }
}


export const useUploadQueue = (dongleId: string) => {
  const [items, setItems] = createStore({
    online: [] as UploadItem[],
    offline: [] as UploadItem[],
  })
  const [loading, setLoading] = createSignal(true)
  const [onlineQueueError, setOnlineQueueError] = createSignal<string | undefined>()
  const [onlineTimeout, setOnlineTimeout] = createSignal<Timer>()
  const [offlineTimeout, setOfflineTimeout] = createSignal<Timer>()
  const [offlineQueueError, setOfflineQueueError] = createSignal<string | undefined>()

  const pollInterval = createMemo(() => onlineQueueError() || offlineQueueError() ? 5000 : 1000)

  const pollOnlineQueue = async () => {
    try {
      const response = await getUploadQueue(dongleId)
      setItems('online', reconcile(mapQueueData(response.result!)))
      setOnlineQueueError(undefined)
    } catch (err) {
      // TODO: fix types here
      if (err instanceof Error && err.cause instanceof Response && err.cause.status === 404) {
        setOnlineQueueError('Device offline')
      } else {
        console.error('Error polling online queue:', err)
        setOnlineQueueError(`${err}`)
      }
    } finally {
      setLoading(false)
      setOnlineTimeout(setTimeout(pollOnlineQueue, pollInterval()))
    }
  }

  const pollOfflineQueue = async () => {
    try {
      const offlineData = await getAthenaOfflineQueue(dongleId)
      setItems('offline', reconcile(processOfflineQueueData(offlineData)))
      setOfflineQueueError(undefined)
    } catch (err) {
      console.debug('Error polling offline queue:', err)
      setOfflineQueueError(`${err}`)
    } finally {
      setOfflineTimeout(setTimeout(pollOfflineQueue, pollInterval()))
    }
  }

  onMount(() => {
    pollOnlineQueue()
    pollOfflineQueue()
  })

  onCleanup(() => {
    clearTimeout(onlineTimeout())
    clearTimeout(offlineTimeout())
  })

  const combined = createMemo(() => [...items.online, ...items.offline])
  const offline = createMemo(() => onlineQueueError() !== undefined)

  return {
    loading,
    items: combined,
    error: onlineQueueError,
    offline,
    clearQueue: () => clearQueue(dongleId, items.online)
  }
}
