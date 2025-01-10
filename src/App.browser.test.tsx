import { beforeAll, expect, test } from 'vitest'
import { configure, render } from '@solidjs/testing-library'

import App from './App'

beforeAll(() => {
  configure({ asyncUtilTimeout: 2000 })
})

test('Show login page', () => {
  const { findByText } = render(() => <App />)
  expect(findByText('Sign in with Google')).not.toBeFalsy()
})
