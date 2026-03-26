import { defineConfig, loadEnv, type HtmlTagDescriptor, type PluginOption } from 'vite'
import solid from 'vite-plugin-solid'
import devtools from 'solid-devtools/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'

// noinspection ES6PreferShortImport
import { Icons } from './src/components/material/Icon'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const plugins: PluginOption[] = [
    devtools(),
    solid({
      ssr: false,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'new connect',
        short_name: 'new connect',
        description: 'Monitor your devices, trips, and uploads from one place.',
        background_color: '#131318',
        theme_color: '#131318',
        start_url: '/',
        id: '/',
      },
      pwaAssets: {
        config: true,
      },
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
      transformIndexHtml(html: string) {
        const icons = Icons.toSorted().join(',')
        const tags: HtmlTagDescriptor[] = [
          {
            tag: 'link',
            attrs: {
              rel: 'stylesheet',
              href: `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0..1,0&icon_names=${icons}&display=block`,
            },
            injectTo: 'head',
          },
        ]
        return {
          html,
          tags,
        }
      },
    },
  ]

  if (env.VITE_SENTRY_ORG && env.VITE_SENTRY_PROJECT) {
    plugins.push(
      sentryVitePlugin({
        org: env.VITE_SENTRY_ORG,
        project: env.VITE_SENTRY_PROJECT,
        authToken: env.SENTRY_AUTH_TOKEN || undefined,
        telemetry: false,
      }),
    )
  }

  return {
    plugins,
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
  }
})
