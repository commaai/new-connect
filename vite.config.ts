import { defineConfig } from 'vite'
import type { VitePlugin } from 'unplugin'
import solid from 'vite-plugin-solid'
import devtools from 'solid-devtools/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'
import path from 'node:path'

// noinspection ES6PreferShortImport
import { Icons } from './src/components/material/Icon'

function multiPagePlugin(options: { template: string; pages: Record<string, { src: string }> }): VitePlugin {
  const { template, pages } = options
  return {
    name: 'vite-multi-page',
    config(config) {
      config.build = config.build || {}
      config.build.rollupOptions = config.build.rollupOptions || {}
      config.build.rollupOptions.input = {}
      config.build.rollupOptions.output = config.build.rollupOptions.output || {}

      const templateContent = fs.readFileSync(path.resolve(template), 'utf-8')
      const bodyEndPos = templateContent.lastIndexOf('</body>')
      for (const name in pages) {
        const tmpFile = `${name}.html`
        const tag = `<script src="${pages[name].src}" type="module"></script>`
        const content = templateContent.slice(0, bodyEndPos) + tag + templateContent.slice(bodyEndPos)
        fs.writeFileSync(tmpFile, content)
        config.build.rollupOptions.input[name] = tmpFile
      }
    },
    buildEnd() {
      for (const name in pages) {
        const filename = `${name}.html`
        if (fs.existsSync(filename)) fs.unlinkSync(filename)
      }
    },
  }
}

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
    multiPagePlugin({
      template: 'template.html',
      pages: {
        index: { src: 'src/index.tsx' },
        offline: { src: 'src/offline.tsx' },
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
