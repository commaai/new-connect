import devtools from 'solid-devtools/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [
    devtools(),
    solid({
      ssr: false,
    }),
    VitePWA({
      base: '/',

      registerType: 'autoUpdate',
      injectRegister: false,

      pwaAssets: {
        disabled: false,
        config: true,
      },

      manifest: {
        name: 'Connect',
        short_name: 'Connect',
        description: 'Connect for Comma AI',
        start_url: '/',
      },

      workbox: undefined,

      devOptions: {
        enabled: true,
        navigateFallback: 'index.html',
        suppressWarnings: true,
        type: 'module',
      },
    }),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
  resolve: {
    alias: {
      '~': '/src',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
