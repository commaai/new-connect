import { getRouteDuration } from '../date'
import { describe, test, expect } from 'vitest'
import type { Route } from '~/types'

describe('getRouteDuration', () => {
  test('calculates duration correctly when start_time is present', () => {
    const route: Route = {
      create_time: 1625155200,
      start_time: '2021-07-01T10:00:00Z',
      end_time: '2021-07-01T12:00:00Z',
      dongle_id: 'test',
      fullname: 'test',
      devicetype: 0,
      maxcamera: 0,
      maxdcamera: 0,
      maxecamera: 0,
      maxlog: 0,
      maxqcamera: 0,
      maxqlog: 0,
      proccamera: 0,
      proclog: 0,
      procqcamera: 0,
      procqlog: 0,
      is_public: false,
      url: '',
      fetched_at: 0,
      user_id: null,
    }
    const duration = getRouteDuration(route)
    expect(duration?.asHours()).toBeCloseTo(2)
  })

  test('uses create_time when start_time is missing', () => {
    const route: Route = {
      create_time: 1625155200,
      end_time: '2021-07-01T18:00:00Z',
      dongle_id: 'test',
      fullname: 'test',
      devicetype: 0,
      maxcamera: 0,
      maxdcamera: 0,
      maxecamera: 0,
      maxlog: 0,
      maxqcamera: 0,
      maxqlog: 0,
      proccamera: 0,
      proclog: 0,
      procqcamera: 0,
      procqlog: 0,
      is_public: false,
      url: '',
      fetched_at: 0,
      user_id: null,
    }
    const duration = getRouteDuration(route)
    expect(duration?.asHours()).toBeCloseTo(2)
  })
})
