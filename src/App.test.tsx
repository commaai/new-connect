import { beforeAll, expect, test } from 'vitest'
import { configure, render, screen } from '@solidjs/testing-library'

import App from './App'

beforeAll(() => {
  configure({ asyncUtilTimeout: 2000 })
})

test('Show login page', async () => {
  render(() => <App />)
  expect(await screen.findByText('Sign in with Google')).not.toBeUndefined()
})
