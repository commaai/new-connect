import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import devtools from 'solid-devtools/vite'

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
