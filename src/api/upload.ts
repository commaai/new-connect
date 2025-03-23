import { RouteInfo, UploadFile, UploadFileMetadata } from '~/types'
import { uploadFilesToUrls } from './athena'
import { getAlreadyUploadedFiles, requestToUploadFiles } from './file'
import { parseRouteName } from './route'

export const FileTypes = {
  logs: ['rlog.bz2', 'rlog.zst'],
  cameras: ['fcamera.hevc'],
  dcameras: ['dcamera.hevc'],
  ecameras: ['ecamera.hevc'],
}

type FileType = keyof typeof FileTypes

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

export const uploadSegments = async (
  routeName: string,
  segmentStart: number,
  segmentEnd: number,
  types?: FileType[],
) => {
  const routeInfo = parseRouteName(routeName)
  const alreadyUploadedFiles = await getFiles(routeName, types)
  const paths = generateMissingFilePaths(routeInfo, segmentStart, segmentEnd, alreadyUploadedFiles, types)
  const pathPresignedUrls = await requestToUploadFiles(routeInfo.dongleId, paths)
  const athenaRequests = prepareUploadRequests(paths, pathPresignedUrls)
  return await uploadFilesToUrls(routeInfo.dongleId, athenaRequests)
}
