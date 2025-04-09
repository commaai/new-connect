import { Route } from '~/api/types'

type RouteKey = keyof Route

export const useRouteCache = <T>(fn: (route: Route) => Promise<T>, keys: readonly RouteKey[] = ['maxqlog']) => {
  const cache = new Map<string, [string, Promise<T>]>()
  return (route: Route) => {
    let res = cache.get(route.fullname)
    const newKey = keys.map((key) => route[key]?.toString()).join('|')
    if (res) {
      const [key, promise] = res
      if (key === newKey) return promise
    }
    const promise = fn(route)
    cache.set(route.fullname, [newKey, promise])
    return promise
  }
}
