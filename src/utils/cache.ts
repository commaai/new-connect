import { Route } from '~/api/types'

interface RouteCacheOptions {
  ignoreMaxqlog?: boolean
}

export const useRouteCache = <T>(fn: (route: Route) => Promise<T>, options: RouteCacheOptions = {}) => {
  const cache = new Map<string, [number, Promise<T>]>()
  return (route: Route) => {
    let res = cache.get(route.fullname)
    if (res) {
      const [maxqlog, promise] = res
      if (options.ignoreMaxqlog || maxqlog === route.maxqlog) return promise
    }
    const promise = fn(route)
    cache.set(route.fullname, [route.maxqlog, promise])
    return promise
  }
}
