import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { configure, render, waitFor } from '@solidjs/testing-library'

import { clearAccessToken, setAccessToken } from '~/api/auth/client'
import * as Demo from '~/api/auth/demo'
import { AppLayout, Routes } from './App'

const DEMO_LOG_ID = '000000dd--455f14369d'
const PUBLIC_ROUTE_ID = 'e886087f430e7fe7/00000221--604653e929'
const PRIVATE_ROUTE_ID = 'e886087f430e7fe7/00000009--84661aeefa'

const UPLOAD_QUEUE = 'Upload Queue'

const renderApp = (location: string) => render(() => <Routes />, { location, wrapper: AppLayout })

beforeAll(() => configure({ asyncUtilTimeout: 2000 }))

describe('Demo mode', () => {
  beforeEach(() => setAccessToken(Demo.ACCESS_TOKEN))

  test('View dashboard', async () => {
    const { findByText } = renderApp('/')
    expect(await findByText('demo 3X')).toBeTruthy()
    expect(await findByText(UPLOAD_QUEUE)).toBeTruthy()
  })

  test('View demo route', async () => {
    const { findByText, findByTestId } = renderApp(`/${Demo.DONGLE_ID}/${DEMO_LOG_ID}`)
    expect(await findByText(DEMO_LOG_ID)).toBeTruthy()
    const video = (await findByTestId('route-video')) as HTMLVideoElement
    await waitFor(() => expect(video.src).toBeTruthy())
  })
})

// TODO: write tests/setup second demo for read-only access tests

describe('Anonymous user', () => {
  beforeEach(() => clearAccessToken())

  test('Show login page', async () => {
    const { findByText } = renderApp('/')
    expect(await findByText('Sign in with Google')).toBeTruthy()
  })

  test('Require route ID in URL', async () => {
    const { findByText } = renderApp(`/${Demo.DONGLE_ID}`)
    expect(await findByText('Sign in with Google')).toBeTruthy()
  })

  test('View demo route', async () => {
    const { findByText } = renderApp(`/${Demo.DONGLE_ID}/${DEMO_LOG_ID}`)
    expect(await findByText(DEMO_LOG_ID)).toBeTruthy()
    // Videos do not load, yet
    // const video = (await findByTestId('route-video')) as HTMLVideoElement
    // await waitFor(() => expect(video.src).toBeTruthy())
  })

  test('Viewing public route should not show device details', async () => {
    const { findByTestId, queryByText } = renderApp(`/${Demo.DONGLE_ID}/${DEMO_LOG_ID}`)
    const video = (await findByTestId('route-video')) as HTMLVideoElement
    await waitFor(() => expect(video.src).toBeTruthy())
    expect(queryByText(UPLOAD_QUEUE)).toBeFalsy()
  })
})

const USERS = [
  { name: 'anonymous', token: '' },
  { name: 'demo user', token: Demo.ACCESS_TOKEN },
]

describe.each(USERS)('Routing (as $name)', ({ token }) => {
  beforeEach(() => setAccessToken(token))

  test('View public route', async () => {
    const { findByText } = renderApp(`/${PUBLIC_ROUTE_ID}`)
    expect(await findByText(PUBLIC_ROUTE_ID.split('/').at(-1)!)).toBeTruthy()
  })

  test('Navigate away from private route', async () => {
    const { findByText } = renderApp(`/${PRIVATE_ROUTE_ID}`)
    expect(await findByText('Sign in with Google')).toBeTruthy()
  })
})
