import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import devtools from 'solid-devtools/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'

// noinspection ES6PreferShortImport
import { Icons } from './src/components/material/Icon'

export default defineConfig({
  plugins: [
    devtools(),
    solid({
      ssr: false,
    }),
    sentryVitePlugin({
      org: 'commaai',
      project: 'new-connect',
      telemetry: false,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxAgeSeconds: 365 * 24 * 60 * 60,
                maxEntries: 30,
              },
            },
          },
        ],
      },
    }),
    {
      name: 'inject-material-symbols',
      transformIndexHtml(html) {
        const icons = Icons.toSorted().join(',')
        return {
          html,
          tags: [
            {
              tag: 'link',
              attrs: {
                rel: 'stylesheet',
                href: `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0..1,0&icon_names=${icons}&display=block`,
              },
              injectTo: 'head',
            },
          ],
        }
      },
    },
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '~': '/src',
    },
  },
})
