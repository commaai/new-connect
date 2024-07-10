import { RouteSegments } from '~/types'
import { getTimelineStatistics, TimelineStatistics } from '~/api/derived'

export type SortKey = 'date' | 'miles' | 'duration' | 'engaged' | 'userFlags'
export type SortOrder = 'asc' | 'desc'

export interface SortOption {
  key: SortKey
  order: SortOrder
}

export const sortRoutes = async (routes: RouteSegments[], option: SortOption): Promise<RouteSegments[]> => {
  const { key, order } = option

  // Fetch timeline statistics for all routes
  const statisticsPromises = routes.map(route => getTimelineStatistics(route))
  const statistics = await Promise.all(statisticsPromises)

  // Create a map of route to its statistics for easy lookup
  const statsMap = new Map<RouteSegments, TimelineStatistics>()
  routes.forEach((route, index) => statsMap.set(route, statistics[index]))

  return [...routes].sort((a, b) => {
    let comparison = 0

    switch (key) {
      case 'date':
        comparison = b.start_time_utc_millis - a.start_time_utc_millis // Most recent first
        break
      case 'miles':
        comparison = (b.length || 0) - (a.length || 0)
        break
      case 'duration':
        comparison = statsMap.get(b)!.duration - statsMap.get(a)!.duration
        break
      case 'engaged':
        comparison = statsMap.get(b)!.engagedDuration - statsMap.get(a)!.engagedDuration
        break
      case 'userFlags':
        comparison = statsMap.get(b)!.userFlags - statsMap.get(a)!.userFlags
        break
    }

    return order === 'asc' ? comparison : -comparison
  })
}
