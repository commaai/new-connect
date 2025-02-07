/// <reference types="@vitest/browser/providers/playwright" />
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
      setupFiles: './src/test/setup.ts',
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
        instances: [
          {
            browser: 'chrome',
          },
        ],
      },
    },
  },
])
