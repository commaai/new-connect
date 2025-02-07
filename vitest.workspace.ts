import { loadEnv } from 'vite'
import { configDefaults, defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  {
    extends: 'vite.config.ts',
    test: {
      include: [
        'src/**/*.{test,spec}.ts',
        'src/**/*.unit.{test,spec}.ts',
      ],
      exclude: [
        ...configDefaults.exclude,
        '**/*.browser.{test,spec}.{ts,tsx}',
      ],
      name: 'unit',
      environment: 'node',
      env: loadEnv('development', '.'),
    },
  },
  {
    extends: 'vite.config.ts',
    test: {
      include: [
        '**/*.browser.{test,spec}.{ts,tsx}',
      ],
      browser: {
        provider: 'playwright',
        enabled: true,
        headless: true,
        name: 'chromium',
      },
    },
  },
])
