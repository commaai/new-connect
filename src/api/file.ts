import {
  CancelUploadRequest,
  CancelUploadResponse,
  Files,
  Route,
  RouteInfo,
  UploadFile,
  UploadFileMetadata,
  UploadFileMetadataResponse,
  UploadFilesToUrlsRequest,
  UploadFilesToUrlsResponse,
  UploadQueueItem,
} from '~/api/types'
import { fetcher } from '.'
import { makeAthenaCall } from '~/api/athena'
import { parseRouteName } from '~/api/route'

export const FileTypes = {
  logs: ['rlog.bz2', 'rlog.zst'],
  cameras: ['fcamera.hevc'],
  dcameras: ['dcamera.hevc'],
  ecameras: ['ecamera.hevc'],
}

export type FileType = keyof typeof FileTypes

// Higher number is lower priority
export const COMMA_CONNECT_PRIORITY = 1

// Uploads expire after 1 week if device remains offline
const EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7

export const getAlreadyUploadedFiles = (routeName: Route['fullname']): Promise<Files> => fetcher<Files>(`/v1/route/${routeName}/files`)

export const requestToUploadFiles = (dongleId: string, paths: string[], expiryDays: number = 7) =>
  fetcher<UploadFileMetadataResponse>(`/v1/${dongleId}/upload_urls/`, {
    method: 'POST',
    body: JSON.stringify({ expiry_days: expiryDays, paths }),
    headers: { 'Content-Type': 'application/json' },
  })

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

export const cancelUpload = (dongleId: string, ids: string[]) =>
  makeAthenaCall<CancelUploadRequest, CancelUploadResponse>(dongleId, 'cancelUpload', { upload_id: ids })

const getFiles = async (routeName: string, types?: FileType[]) => {
  const files = await getAlreadyUploadedFiles(routeName)
  if (!types) return [...files.cameras, ...files.dcameras, ...files.ecameras, ...files.logs]
  return types.flatMap((type) => files[type])
}

const generateMissingFilePaths = (
  routeInfo: RouteInfo,
  segmentStart: number,
  segmentEnd: number,
  uploadedFiles: string[],
  types?: FileType[],
): string[] => {
  const paths: string[] = []
  for (let i = segmentStart; i <= segmentEnd; i++) {
    const fileTypes = types ? types.flatMap((type) => FileTypes[type]) : Object.values(FileTypes).flat()
    for (const fileName of fileTypes) {
      const key = [routeInfo.dongleId, routeInfo.routeId, i, fileName].join('/')
      if (!uploadedFiles.find((path) => path.includes(key))) {
        paths.push(`${routeInfo.routeId}--${i}/${fileName}`)
      }
    }
  }
  return paths
}

const prepareUploadRequests = (paths: string[], presignedUrls: UploadFileMetadata[]): UploadFile[] =>
  paths.map((path, i) => ({ filePath: path, ...presignedUrls[i] }))

export const uploadAllSegments = (routeName: string, totalSegments: number, types?: FileType[]) =>
  uploadSegments(routeName, 0, totalSegments - 1, types)

export const uploadSegments = async (routeName: string, segmentStart: number, segmentEnd: number, types?: FileType[]) => {
  const routeInfo = parseRouteName(routeName)
  const alreadyUploadedFiles = await getFiles(routeName, types)
  const paths = generateMissingFilePaths(routeInfo, segmentStart, segmentEnd, alreadyUploadedFiles, types)
  const pathPresignedUrls = await requestToUploadFiles(routeInfo.dongleId, paths)
  const athenaRequests = prepareUploadRequests(paths, pathPresignedUrls)
  if (athenaRequests.length === 0) return []
  return await uploadFilesToUrls(routeInfo.dongleId, athenaRequests)
}
