// vite.config.js
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import devtools from 'solid-devtools/vite'
import path from 'node:path'
import fs from 'node:fs'

export default defineConfig({
  plugins: [
    devtools(),
    solid({
      ssr: false,
    }),
    {
      name: 'log-server-start',
      configureServer(server) {
        server.httpServer?.once('listening', () => {
          const address = server.httpServer?.address()
          if (typeof address === 'object' && address !== null) {
            console.log(`Server listening on port ${address.port}`)
          }
        })
      },
    },
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: 'index.html',
        'service-worker': './src/service-worker.js',
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'service-worker'
            ? '[name].js'
            : 'assets/[name]-[hash].js'
        },
      },
      plugins: [
        {
          name: 'copy-pwa-assets',
          generateBundle() {
            const pwaAssetsDir = path.resolve(__dirname, 'pwa-assets')
            if (fs.existsSync(pwaAssetsDir)) {
              const files = fs.readdirSync(pwaAssetsDir)
              for (const file of files) {
                this.emitFile({
                  type: 'asset',
                  fileName: `pwa-assets/${file}`,
                  source: fs.readFileSync(path.resolve(pwaAssetsDir, file)),
                })
              }
            }
          },
        },
      ],
    },
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
