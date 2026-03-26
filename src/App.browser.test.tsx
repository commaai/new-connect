import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { configure, render } from '@solidjs/testing-library'
import { QueryClientProvider } from '@tanstack/solid-query'

import { setAccessToken, signOut } from '~/api/auth/client'
import { getAppQueryClient } from '~/api/query-client'
import * as Demo from '~/api/auth/demo'
import { AppLayout, Routes } from './App'

const renderApp = (location: string) =>
  render(
    () => (
      <QueryClientProvider client={getAppQueryClient()}>
        <AppLayout>
          <Routes />
        </AppLayout>
      </QueryClientProvider>
    ),
    { location },
  )

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
})
