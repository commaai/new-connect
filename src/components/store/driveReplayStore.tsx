import { createSignal } from 'solid-js'

// Create a store
const [videoTime, setVideoTime] = createSignal(0)

export function videoTimeStore() {
  return { videoTime, setVideoTime }
}

const [speed, setSpeed] = createSignal(0)

export function speedStore() {
  return { speed, setSpeed }
}
