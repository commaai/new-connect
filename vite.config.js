import solid from 'solid-start/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    solid({
      ssr: false,
    }),
    visualizer(),
  ],
})
