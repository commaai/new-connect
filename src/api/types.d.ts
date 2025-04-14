export interface Profile {
  email: string
  id: string
  regdate: number
  superuser: boolean
  user_id: string
}

export interface DeviceLocation {
  lat: number
  lng: number
  time: number
  accuracy: number
  speed: number
  bearing: number
}

export interface ApiDevice {
  dongle_id: string
  alias: string
  serial: string
  last_athena_ping: number
  ignore_uploads: boolean | null
  is_paired: boolean
  is_owner: boolean
  public_key: string
  prime: boolean
  prime_type: number
  trial_claimed: boolean
  device_type: string
  openpilot_version: string
  sim_id: string
  sim_type: number
  eligible_features: {
    prime: boolean
    prime_data: boolean
    nav: boolean
  }
}

export interface Device extends ApiDevice {
  is_online: boolean
}

export interface DrivingStatisticsAggregation {
  distance: number
  minutes: number
  routes: number
}

export interface DrivingStatistics {
  all: DrivingStatisticsAggregation
  week: DrivingStatisticsAggregation
}

export interface Route {
  can: boolean
  create_time: number
  devicetype: number
  dongle_id: string
  end_lat: number // default to 0
  end_lng: number // default to 0
  end_time: string | null
  fullname: string
  git_branch: string | null
  git_commit: string | null
  git_dirty: boolean | null
  git_remote: string | null
  hpgps: boolean
  init_logmonotime: number | null
  is_public: boolean
  length: number // default to 0
  maxcamera: number
  maxdcamera: number
  maxecamera: number
  maxlog: number
  maxqcamera: number
  maxqlog: number
  passive: boolean | null
  platform: string | null
  proccamera: number
  proclog: number
  procqcamera: number
  procqlog: number
  radar: boolean
  start_lat: number // default to 0
  start_lng: number // default to 0
  start_time: string | null
  url: string
  user_id: string | null
  version: string | null
  vin: string | null
}

export interface RouteInfo {
  dongleId: string
  routeId: string
}

export interface RouteShareSignature extends Record<string, string> {
  exp: string
  sig: string
}

export interface Files {
  cameras: string[]
  dcameras: string[]
  ecameras: string[]
  logs: string[]
  qcameras: string[]
  qlogs: string[]
}

export type AthenaOfflineQueueResponse = AthenaOfflineQueueItem<unknown>[]

export interface AthenaOfflineQueueItem<T> extends AthenaCallRequest<T> {
  expiry: number
}

export interface AthenaCallRequest<T> {
  expiry?: number
  id: number
  jsonrpc: '2.0'
  method: string
  params: T
}

export interface AthenaCallResponse<T> {
  queued: boolean
  error?: string
  result?: T
}

export interface BackendAthenaCallResponse<T> {
  id: string
  jsonrpc: '2.0'
  result: T | string
}

export interface BackendAthenaCallResponseError {
  error: string
}

export interface DataFile {
  allow_cellular: boolean
  fn: string
  headers: Record<string, string>
  priority: number
  url: string
}

export interface UploadFilesToUrlsRequest {
  files_data: DataFile[]
}

export interface UploadFilesToUrlsResponse {
  enqueued: number
  failed: string[]
  items: UploadQueueItem[]
}

export interface UploadFileMetadata {
  headers: Record<string, string>
  url: string
}

export type UploadFileMetadataResponse = UploadFileMetadata[]

export interface UploadFile extends UploadFileMetadata {
  filePath: string
}

export interface CancelUploadRequest {
  upload_id: string | string[]
}

export interface CancelUploadResponse {
  [key: string]: number | string
}

export interface UploadQueueItem {
  allow_cellular: boolean
  created_at: number
  current: boolean
  headers: Record<string, string>
  id: string
  path: string
  priority: number
  progress: number
  retry_count: number
  url: string
}
