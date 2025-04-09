import type { Accessor, Resource } from 'solid-js'

// these types aren't exported
// from https://github.com/solidjs/solid/blob/v1.9.5/packages/solid/src/reactive/signal.ts#L483
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

export function narrow<A, B extends A>(accessor: A | Accessor<A>, guard: (v: A) => v is B): B | null {
  const val = typeof accessor === 'function' ? (accessor as Accessor<A>)() : accessor
  return guard(val) ? val : null
}
