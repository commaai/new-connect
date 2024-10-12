import { createSignal, createMemo, createEffect, onCleanup, onMount } from 'solid-js'
import type { Accessor } from 'solid-js'
import breakpoints from './breakpoints'

type Dimensions = { width: number; height: number }

const match = (query: string) => {
  const media = window.matchMedia(query.replace(/^@media( ?)/m, ''))
  return media.matches
}

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

export function useMediaQuery(query: string) {
  const [matches, setMatches] = createSignal(false)

  const listener = () => {
    setMatches(match(query))
  }

  createEffect(() => {
    listener()
    window.addEventListener('resize', listener)
    return () => window.removeEventListener('resize', listener)
  })

  return matches
}

export function useScreen() {
  const desktop = useMediaQuery(breakpoints.up('lg'))
  const tablet = useMediaQuery(breakpoints.only('md'))
  const mobile = useMediaQuery(breakpoints.down('sm'))
  return createMemo(() => {
    return {mobile: mobile, tablet: tablet, desktop: desktop}
  })
}

