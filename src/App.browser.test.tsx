import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { configure, render, waitFor } from '@solidjs/testing-library'

import { signOut, setAccessToken } from '~/api/auth/client'
import * as Demo from '~/api/auth/demo'
import { AppLayout, Routes } from './App'

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
