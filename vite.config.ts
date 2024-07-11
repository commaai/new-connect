import fs from 'fs'
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
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Connect',
        short_name: 'Connect',
        description: 'Connect description',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    https: {
      key: fs.readFileSync('./server.key'),
      cert: fs.readFileSync('./server.crt'),
    },
    host: '0.0.0.0',
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
