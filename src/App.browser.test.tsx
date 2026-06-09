import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { configure, render, waitFor } from '@solidjs/testing-library'

import { setAccessToken, signOut } from '~/api/auth/client'
import * as Demo from '~/api/auth/demo'
import { AppLayout, Routes } from './App'
import { isSafeInternalPath, popRedirect } from '~/api/auth/redirect'

const DEMO_LOG_ID = '000000dd--455f14369d'

const renderApp = (location: string) => render(() => <Routes />, { location, wrapper: AppLayout })

beforeAll(() => configure({ asyncUtilTimeout: 3000 }))
beforeEach(() => signOut())

test('Show login page', async () => {
  const { findByText } = renderApp('/')
  expect(await findByText('Sign in with Google')).toBeTruthy()
})

describe('Demo mode', () => {
  beforeEach(() => setAccessToken(Demo.ACCESS_TOKEN))

  test('View dashboard', async () => {
    const { findByText } = renderApp('/')
    expect(await findByText('demo 3X')).toBeTruthy()
  })

  test('View demo route', async () => {
    const { findByText, findByTestId } = renderApp(`/${Demo.DONGLE_ID}/${DEMO_LOG_ID}`)
    expect(await findByText(DEMO_LOG_ID)).toBeTruthy()
    const video = (await findByTestId('route-video')) as HTMLVideoElement
    await waitFor(() => expect(video.src).toBeTruthy())
  })
})

describe('Post-login redirect', () => {
  test('open-redirect guard rejects external and malformed targets', () => {
    expect(isSafeInternalPath('/abc123/route')).toBe(true)
    expect(isSafeInternalPath('//evil.com')).toBe(false)
    expect(isSafeInternalPath('/\\evil.com')).toBe(false)
    expect(isSafeInternalPath('https://evil.com')).toBe(false)
    expect(isSafeInternalPath('')).toBe(false)
    expect(isSafeInternalPath(null)).toBe(false)
  })

  test('remembers intended destination when visiting a protected route signed out', async () => {
    const dest = `/${Demo.DONGLE_ID}/${DEMO_LOG_ID}`
    const { findByText } = renderApp(dest)
    expect(await findByText('Sign in with Google')).toBeTruthy()
    expect(popRedirect()).toBe(dest)
  })
})

describe.skip('Public routes', () => {
  test('View shared device', async () => {
    const { findByText } = renderApp(`/${Demo.DONGLE_ID}`)
    expect(await findByText('Not signed in')).toBeTruthy()
    expect(await findByText('Shared Device')).toBeTruthy()
  })

  test('View public route without signing in', async () => {
    const { findByText } = renderApp(`/${Demo.DONGLE_ID}/${DEMO_LOG_ID}`)
    expect(await findByText(DEMO_LOG_ID)).toBeTruthy()
    // Videos do not load, yet
    // const video = (await findByTestId('route-video')) as HTMLVideoElement
    // await waitFor(() => expect(video.src).toBeTruthy())
  })
})
