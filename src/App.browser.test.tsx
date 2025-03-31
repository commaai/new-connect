import { beforeAll, describe, expect, test } from 'vitest'
import { configure, render, waitFor } from '@solidjs/testing-library'

import { clearAccessToken, setAccessToken } from '~/api/auth/client'
import * as Demo from '~/api/auth/demo'
import { AppLayout, Routes } from './App'

const DEMO_LOG_ID = '000000dd--455f14369d'
const PUBLIC_ROUTE_ID = 'e886087f430e7fe7/00000221--604653e929'
const PRIVATE_ROUTE_ID = 'e886087f430e7fe7/00000009--84661aeefa'

// until errors are properly handled
const SKIP_PRIVATE = true

const UPLOAD_QUEUE = 'Upload Queue'

const renderApp = (location: string) => render(() => <Routes />, { location, wrapper: AppLayout })

beforeAll(() => configure({ asyncUtilTimeout: import.meta.env.CI ? 10000 : 5000 }))

describe('Demo mode', () => {
  beforeAll(() => setAccessToken(Demo.ACCESS_TOKEN))

  test('View dashboard', async () => {
    const { findByText } = renderApp('/')
    expect(await findByText('demo 3X')).toBeTruthy()
    expect(await findByText(UPLOAD_QUEUE)).toBeTruthy()
  })

  test('View demo route', async () => {
    const { findByText, findByTestId } = renderApp(`/${Demo.DONGLE_ID}/${DEMO_LOG_ID}`)
    // Route visible
    expect(await findByText(DEMO_LOG_ID)).toBeTruthy()
    const video = (await findByTestId('route-video')) as HTMLVideoElement
    await waitFor(() => expect(video.src).toBeTruthy())
  })

  test('View public route', async () => {
    const { findByText, queryByText } = renderApp(`/${PUBLIC_ROUTE_ID}`)
    // Route visible
    expect(await findByText(PUBLIC_ROUTE_ID.split('/').at(-1)!)).toBeTruthy()
    // Videos do not load, yet
    // const video = (await findByTestId('route-video')) as HTMLVideoElement
    // await waitFor(() => expect(video.src).toBeTruthy())
    // Device hidden
    expect(queryByText(UPLOAD_QUEUE)).toBeFalsy()
  })

  test.skipIf(SKIP_PRIVATE)('Navigate away from private route', async () => {
    const { findByText } = renderApp(`/${PRIVATE_ROUTE_ID}`)
    expect(await findByText('demo 3X')).toBeTruthy()
  })
})

// TODO: write tests/setup second demo for read-only access tests

describe('Anonymous user', () => {
  beforeAll(() => clearAccessToken())

  test('Show login page', async () => {
    const { findByText } = renderApp('/')
    expect(await findByText('Sign in with Google')).toBeTruthy()
  })

  test('Require route ID in URL', async () => {
    const { findByText } = renderApp(`/${Demo.DONGLE_ID}`)
    expect(await findByText('Sign in with Google')).toBeTruthy()
  })

  test.skip('View demo route', async () => {
    const { findByText, queryByText } = renderApp(`/${Demo.DONGLE_ID}/${DEMO_LOG_ID}`)
    // Route visible
    expect(await findByText(DEMO_LOG_ID)).toBeTruthy()
    // Videos do not load, yet
    // const video = (await findByTestId('route-video')) as HTMLVideoElement
    // await waitFor(() => expect(video.src).toBeTruthy())
    // Device hidden
    expect(queryByText(UPLOAD_QUEUE)).toBeFalsy()
  })

  test.skip('View public route', async () => {
    const { findByText, queryByText } = renderApp(`/${PUBLIC_ROUTE_ID}`)
    // Route visible
    expect(await findByText(PUBLIC_ROUTE_ID.split('/').at(-1)!)).toBeTruthy()
    // Device hidden
    expect(queryByText(UPLOAD_QUEUE)).toBeFalsy()
  })

  test.skipIf(SKIP_PRIVATE)('Navigate away from private route', async () => {
    const { findByText } = renderApp(`/${PRIVATE_ROUTE_ID}`)
    expect(await findByText('Sign in with Google')).toBeTruthy()
  })
})
