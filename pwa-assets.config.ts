import {
  createAppleSplashScreens,
  defaultAssetName,
  defaultSplashScreenName,
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    ...minimal2023Preset,
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0.4,
      resizeOptions: { background: '#131318' },
    },
    apple: {
      ...minimal2023Preset.apple,
      resizeOptions: { background: '#131318' },
    },
    appleSplashScreens: createAppleSplashScreens({
      padding: 0.5,
      resizeOptions: { fit: 'contain', background: '#131318' },
      linkMediaOptions: {
        log: true,
        addMediaScreen: true,
        basePath: '/',
        xhtml: true,
      },
      name(landscape, size, dark) {
        return 'images/pwa-' + defaultSplashScreenName(landscape, size, dark)
      },
    }),
    assetName(type, size) {
      return 'images/pwa-' + defaultAssetName(type, size)
    },
  },
  images: ['public/favicon.svg'],
})
