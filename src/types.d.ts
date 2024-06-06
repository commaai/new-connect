export interface Profile {
  email: string
  id: string
  regdate: number
  superuser: boolean
  user_id: string
}

export interface Device {
  dongle_id: string
  alias: string
  serial: string
  last_athena_ping: number
  ignore_uploads: boolean
  is_paired: boolean
  is_owner: boolean
  public_key: string
  prime: boolean
  prime_type: number
  trial_claimed: boolean
  device_type: string
  openpilot_version: string
  sim_id: string
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

export interface DeviceUser {
  email: string
  permission: 'read_access' | 'owner'
}

export enum SegmentDataSource {
  EON = 3,
  TWO = 6,
  THREE = 7,
}

export interface Route {
  fullname: string
  dongle_id: string
  user_id: string
  is_public: boolean
  url: string
  create_time: number
  segment_numbers: number[]
  segment_start_times: number[]
  segment_end_times: number[]
  length?: number
  can?: boolean
  hpgps?: boolean
  radar?: boolean
  devicetype: number
  maxqlog: number
  procqlog: number
  start_time: number
  end_time?: number
  passive?: boolean
  version?: string
  git_commit?: string
  git_branch?: string
  git_remote?: string
  git_dirty?: boolean
  platform?: string
  vin?: string
  init_logmonotime?: number
  share_exp?: string
  share_sig?: string
}

export interface Clip {
  id: number
  create_time: number
  dongle_id: string
  route_name: string
  start_time: number
  end_time: number
  title: string
  video_type: 'q' | 'f' | 'e' | 'd' | '360'
  is_public: boolean
  status?: 'pending' | 'done' | 'failed'
}

export interface PendingClip extends Clip {
  status: 'pending'
  pending_status: 'waiting_jobs' | 'processing'
  pending_progress: number
}

export interface DoneClip extends Clip {
  status: 'done'
  url: string
  thumbnail: string
}

export interface FailedClip extends Clip {
  status: 'failed'
  error_status:
    | 'upload_failed_request'
    | 'upload_failed'
    | 'upload_failed_dcam'
    | 'upload_failed_timeout'
    | 'export_failed'
}
