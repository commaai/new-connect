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
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    rollupOptions: {
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
