import type { Resource } from 'solid-js'

// from https://github.com/solidjs/solid/blob/main/packages/solid/src/reactive/signal.ts#L483
interface Ready<T> {
  state: 'ready'
  loading: false
  error: undefined
  latest: T
  (): T
}
interface Refreshing<T> {
  state: 'refreshing'
  loading: true
  error: undefined
  latest: T
  (): T
}

export function resolved<T>(data: Resource<T>): data is Ready<T> | Refreshing<T> {
  return data.state === 'ready' || data.state === 'refreshing'
}
