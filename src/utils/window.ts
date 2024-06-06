import { createSignal, onCleanup, onMount } from 'solid-js'
import type { Accessor } from 'solid-js'

type Dimensions = { width: number; height: number }

export const getDimensions = (): Dimensions => {
  if (typeof window === 'undefined') return { width: 0, height: 0 }
  const { innerWidth: width, innerHeight: height } = window
  return { width, height }
}

export const useDimensions = (): Accessor<Dimensions> => {
  const [dimensions, setDimensions] = createSignal(getDimensions())

  const onResize = () => setDimensions(getDimensions())
  if (typeof window !== 'undefined') {
    onMount(() => window.addEventListener('resize', onResize))
    onCleanup(() => window.removeEventListener('resize', onResize))
  }

  return dimensions
}
