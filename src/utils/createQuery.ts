import { createEffect, createResource, createSignal, onCleanup, type Accessor, type ResourceReturn } from 'solid-js'

export const createQuery = <TSource, TResult>(options: {
  source: Accessor<TSource | null>
  fetcher: (source: TSource) => Promise<TResult>
  refetchInterval?: number
  stopCondition?: (result?: TResult) => boolean
  retryInterval?: number
}): ResourceReturn<TResult, TSource> => {
  const [counter, setCounter] = createSignal(0)
  const invalidate = () => setCounter(counter() + 1)

  const [data, actions] = createResource(
    () => {
      const source = options.source()
      return source !== null ? ([source, counter()] as [TSource, number]) : null
    },
    async ([source]) => options.fetcher(source),
  )

  const { refetchInterval, stopCondition } = options
  if (refetchInterval) {
    const interval = setInterval(() => {
      if (data.loading) return
      invalidate()
    }, refetchInterval)

    if (stopCondition)
      createEffect(() => {
        if (!stopCondition(data())) return
        clearInterval(interval)
      })

    onCleanup(() => clearInterval(interval))
  }

  const { retryInterval } = options
  if (retryInterval)
    createEffect(() => {
      if (data.state !== 'errored') return
      setTimeout(() => {
        if (data.state !== 'errored') return
        invalidate()
      }, retryInterval)
    })

  return [data, actions]
}
