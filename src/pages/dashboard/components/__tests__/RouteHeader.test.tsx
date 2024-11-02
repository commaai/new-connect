import { render } from '@solidjs/testing-library'
import { describe, test, expect } from 'vitest'
import { RouteHeader } from '../RouteHeader'
import type { RouteSegments } from '~/types'

describe('RouteHeader', () => {
  test('displays date and time when available', () => {
    const route: RouteSegments = {
      create_time: 1625155200,
      start_time_utc_millis: 1625155200000,
      end_time_utc_millis: 1625162400000,
      dongle_id: 'test',
      fullname: 'test',
      is_preserved: false,
      share_exp: '123',
      share_sig: '456',
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
      user_id: 'test',
    }

    const screen = render(() => <RouteHeader route={route} />)
    expect(screen.getByText('Thu, Jul 1, 2021')).toBeTruthy()
    expect(screen.getByText('10:00 AM to 12:00 PM')).toBeTruthy()
  })

  test('handles routes with no time data gracefully', () => {
    const route: RouteSegments = {
      create_time: 1625155200,
      start_time_utc_millis: undefined,
      end_time_utc_millis: undefined,
      dongle_id: 'test',
      fullname: 'test',
      is_preserved: false,
      share_exp: '123',
      share_sig: '456',
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
      user_id: 'test',
    }

    const screen = render(() => <RouteHeader route={route} />)
    expect(screen.getByText('Thu, Jul 1, 2021')).toBeTruthy()
    expect(screen.queryByText('10:00 AM')).toBeTruthy()
    expect(screen.queryByText('to')).toBeFalsy()
  })
})
