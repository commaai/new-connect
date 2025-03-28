import Hls from 'hls.js/dist/hls.light.mjs'

export function createHls() {
  return new Hls({
    // various captions, we don't use
    enableWebVTT: false,
    enableIMSC1: false,
    enableCEA708Captions: false,
  })
}

export default Hls
