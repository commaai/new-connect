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
  can?: boolean
  create_time: number
  devicetype: number
  dongle_id: string
  start_lng?: number
  start_lat?: number
  end_lat?: number
  end_lng?: number
  end_time: string
  fullname?: string
  git_branch?: string
  git_commit?: string
  git_dirty?: boolean
  git_remote?: string
  hpgps?: boolean
  init_logmonotime?: number
  is_public: boolean
  length?: number
  maxcamera: number
  maxdcamera: number
  maxecamera: number
  maxlog: number
  maxqcamera: number
  maxqlog: number
  passive?: boolean
  platform?: string
  proccamera: number
  proclog: number
  procqcamera: number
  procqlog: number
  radar?: boolean
  start_time: string
  url: string
  user_id: string | null
  version?: string
  vin?: string
}

export interface RouteShareSignature extends Record<string, string> {
  exp: string
  sig: string
}

export interface RouteSegments extends Route {
  end_time_utc_millis?: number
  is_preserved?: boolean
  segment_end_times?: number[]
  segment_numbers?: number[]
  segment_start_times?: number[]
  share_exp?: RouteShareSignature['exp']
  share_sig?: RouteShareSignature['sig']
  start_time_utc_millis?: number
}

export interface GeocodeResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
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
