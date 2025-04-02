import { createAppleSplashScreens, defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    ...minimal2023Preset,
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0.5,
      resizeOptions: { background: '#131318' },
    },
    apple: {
      ...minimal2023Preset.apple,
      padding: 0.5,
      resizeOptions: { background: '#131318' },
    },
    appleSplashScreens: createAppleSplashScreens({
      padding: 0.7,
      resizeOptions: { fit: 'contain', background: '#131318' },
      linkMediaOptions: {
        addMediaScreen: true,
        xhtml: true,
      },
      name: (landscape, size) => {
        // make sure to update when generating light/dark variants
        return `apple-splash-${landscape ? 'landscape' : 'portrait'}-${size.width}x${size.height}.png`
      },
    }),
  },
  images: ['public/favicon.svg'],
})
