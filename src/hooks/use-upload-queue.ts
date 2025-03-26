import { createSignal, createMemo, onCleanup, createEffect } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'
import { cancelUpload, getUploadQueue } from '~/api/athena'
import { getAthenaOfflineQueue } from '~/api/devices'
import type { UploadFilesToUrlsRequest, UploadItem } from '~/types'
import { UploadQueueItem as AthenaOnlineUploadQueueItem, AthenaOfflineQueueItem } from '~/types'

const parseUploadPath = (url: string) => {
  const parts = new URL(url).pathname.split('/')
  const route = parts[3]
  const segment = parseInt(parts[4], 10)
  const filename = parts[5]

  return { route, segment, filename }
}

const formatProgress = (item: AthenaOnlineUploadQueueItem | AthenaOfflineQueueItem<unknown>) => {
  if ('current' in item) return Math.round(item.progress * 100)
  return 0
}

const mapOfflineQueue = (data: AthenaOfflineQueueItem<unknown>[]): UploadItem[] =>
  data
    .filter((item) => item.method === 'uploadFilesToUrls')
    .flatMap((item) =>
      (item as AthenaOfflineQueueItem<UploadFilesToUrlsRequest>).params.files_data.map((file) => {
        const { route, segment, filename } = parseUploadPath(file.url)
        const progress = formatProgress(item)
        return {
          id: file.url,
          route,
          segment,
          filename,
          uploadUrl: file.url,
          progress,
          priority: file.priority,
          retryCount: 0,
          status: getUploadStatus(item, progress),
        }
      }),
    )

const mapOnineQueue = (data: AthenaOnlineUploadQueueItem[]): UploadItem[] =>
  data.map((item) => {
    const { route, segment, filename } = parseUploadPath(item.url)
    const progress = formatProgress(item)
    return {
      id: item.id,
      route,
      segment,
      filename,
      uploadUrl: item.url,
      progress,
      priority: item.priority,
      retryCount: item.retry_count,
      status: getUploadStatus(item, progress),
    }
  })

const getUploadStatus = (item: AthenaOnlineUploadQueueItem | AthenaOfflineQueueItem<unknown>, progress: number): UploadItem['status'] => {
  if ('current' in item) {
    if (progress === 100) return 'completed'
    if (item.current) return 'uploading'
    if (item.retry_count > 0) return 'error'
    return 'queued'
  }
  return 'waiting_for_network'
}

const getStatusPriority = (status: UploadItem['status']): number => {
  switch (status) {
    case 'completed':
    case 'error':
      return 0
    case 'uploading':
      return 1
    case 'queued':
    case 'waiting_for_network':
      return 2
  }
}

export const useUploadQueue = async (dongleId: string) => {
  const [items, setItems] = createStore({ online: [] as UploadItem[], offline: [] as UploadItem[] })
  const [onlineQueueError, setOnlineQueueError] = createSignal<string | undefined>()
  const [clearQueueError, setClearQueueError] = createSignal<string | undefined>()
  const [clearingQueue, setClearingQueue] = createSignal(false)
  const [loading, setLoading] = createSignal(true)
  const pollInterval = createMemo(() => (onlineQueueError() ? 5000 : 2000))
  const offline = createMemo(() => onlineQueueError() !== undefined)

  const clearQueue = async (queueItems: UploadItem[]) => {
    if (clearingQueue() || queueItems.length === 0) return
    setClearQueueError(undefined)
    setClearingQueue(true)

    try {
      await cancelUpload(
        dongleId,
        queueItems.map((item) => item.id),
      )
    } catch (err) {
      console.debug('Error clearing queue:', err)
      setClearQueueError(`Error clearing queue: ${err}`)
    } finally {
      setClearingQueue(false)
    }
  }

  const pollOnlineQueue = async () => {
    try {
      const response = await getUploadQueue(dongleId)
      if (response.result) {
        setItems('online', reconcile(mapOnineQueue(response.result)))
      }
      setOnlineQueueError(undefined)
    } catch (err) {
      if (err instanceof Error && err.cause instanceof Response && err.cause.status === 404) {
        setOnlineQueueError('Device offline')
      } else {
        console.debug('Error polling online queue:', err)
        setOnlineQueueError(`Error polling online queue: ${err}`)
      }
    }
  }

  const pollOfflineQueue = async () => {
    try {
      const offlineItems = await getAthenaOfflineQueue(dongleId)
      setItems('offline', reconcile(mapOfflineQueue(offlineItems)))
    } catch (err) {
      console.debug('Error polling offline queue:', err)
    }
  }

  const pollQueues = () => Promise.all([pollOnlineQueue(), pollOfflineQueue()])

  createEffect(() => {
    if (loading()) return

    let timer: Timer
    pollQueues().finally(() => {
      timer = setTimeout(() => pollQueues(), pollInterval())
    })

    onCleanup(() => clearTimeout(timer))
  })

  const sortedItems = createMemo(() => {
    const allItems = [...items.offline, ...(offline() ? [] : items.online)]
    return allItems.sort((a, b) => {
      const statusDiff = getStatusPriority(a.status) - getStatusPriority(b.status)
      if (statusDiff !== 0) return statusDiff
      const routeDiff = a.route.localeCompare(b.route)
      if (routeDiff !== 0) return routeDiff
      const segmentDiff = a.segment - b.segment
      if (segmentDiff !== 0) return segmentDiff
      return a.filename.localeCompare(b.filename)
    })
  })

  await pollQueues().finally(() => setLoading(false))

  return {
    clearQueue: () => void clearQueue(items.online),
    clearingQueue,
    clearQueueError,
    error: onlineQueueError,
    items: sortedItems,
    offline,
  }
}
