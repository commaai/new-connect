import { beforeAll, describe, expect, test } from 'vitest'
import { configure, render } from '@solidjs/testing-library'

import { clearAccessToken, setAccessToken } from '~/api/auth/client'
import * as Demo from '~/api/auth/demo'
import { Routes } from './App'

beforeAll(() => {
  configure({ asyncUtilTimeout: 2000 })
  clearAccessToken()
})

test('Show login page', async () => {
  const { findByText } = render(() => <Routes />, { location: '/login' })
  expect(await findByText('Sign in with Google')).not.toBeFalsy()
})

describe('Demo mode', () => {
  test('Render dashboard', async () => {
    setAccessToken(Demo.ACCESS_TOKEN)
    const { findByText } = render(() => <Routes />, { location: '/' })
    expect(await findByText('demo 3X')).not.toBeFalsy()
  })
})
