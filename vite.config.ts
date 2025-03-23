import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import devtools from 'solid-devtools/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'

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
    {
      name: 'inject-material-symbols',
      transformIndexHtml(html) {
        // Specify icon names to load only the necessary icons, reducing font payload.
        // https://developers.google.com/fonts/docs/material_symbols#optimize_the_icon_font
        // biome-ignore format: the array should not be formatted
        const icons = [
          'add', 'arrow_back', 'camera', 'check', 'chevron_right', 'clear', 'close', 'directions_car', 'download',
          'error', 'file_copy', 'info', 'menu', 'my_location', 'open_in_new', 'payments', 'person', 'progress_activity',
          'satellite_alt', 'search', 'settings', 'sync',
        ].toSorted().join(',')
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
