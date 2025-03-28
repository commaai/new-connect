import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { configure, render } from '@solidjs/testing-library'

import { clearAccessToken, setAccessToken } from '~/api/auth/client'
import * as Demo from '~/api/auth/demo'
import { Routes } from './App'

beforeAll(() => configure({ asyncUtilTimeout: 2000 }))
beforeEach(() => clearAccessToken())

const DEMO_LOG_ID = '000000dd--455f14369d'

test('Show login page', async () => {
  const { findByText } = render(() => <Routes />, { location: '/login' })
  expect(await findByText('Sign in with Google')).not.toBeFalsy()
})

describe('Demo mode', () => {
  beforeEach(() => setAccessToken(Demo.ACCESS_TOKEN))

  test('Render dashboard', async () => {
    const { findByText } = render(() => <Routes />, { location: '/' })
    expect(await findByText('demo 3X')).not.toBeFalsy()
  })

  test('Render route', async () => {
    const { findByText } = render(() => <Routes />, { location: `/${Demo.DONGLE_ID}/${DEMO_LOG_ID}` })
    expect(await findByText(DEMO_LOG_ID)).not.toBeFalsy()
  })
})
