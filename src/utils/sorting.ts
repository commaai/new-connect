import { RouteSegments } from '~/types'
import { getTimelineStatistics, TimelineStatistics } from '~/api/derived'

export type SortKey = 'date' | 'miles' | 'duration' | 'engaged' | 'userFlags'
export type SortOrder = 'asc' | 'desc' | null

export interface SortOption {
  label: string
  key: SortKey
  order: SortOrder
}

export const sortRoutes = async (routes: RouteSegments[], option: SortOption): Promise<RouteSegments[]> => {
  console.log('Sorting routes with option:', option)
  const { key, order } = option

  // Fetch timeline statistics for all routes
  const statisticsPromises = routes.map(route => getTimelineStatistics(route))
  const statistics = await Promise.all(statisticsPromises)

  // Create a map of route to its statistics for easy lookup
  const statsMap = new Map<RouteSegments, TimelineStatistics>()
  routes.forEach((route, index) => statsMap.set(route, statistics[index]))

  // Add all relevant data to each route object
  const routesWithData = routes.map(route => ({
    ...route,
    duration: statsMap.get(route)?.duration || 0,
    engagedDuration: statsMap.get(route)?.engagedDuration || 0,
    userFlags: statsMap.get(route)?.userFlags || 0,
  }))

  const sortedRoutes = routesWithData.sort((a, b) => {
    let comparison = 0

    switch (key) {
      case 'date':
        comparison = b.start_time_utc_millis - a.start_time_utc_millis
        break
      case 'miles':
        comparison = (b.length || 0) - (a.length || 0)
        break
      case 'duration':
        comparison = b.duration - a.duration
        break
      case 'engaged':
        comparison = b.engagedDuration - a.engagedDuration
        break
      case 'userFlags':
        comparison = b.userFlags - a.userFlags
        break
    }

    return order === 'asc' ? comparison : -comparison
  })

  console.log('Sorted routes:', sortedRoutes.map(r => ({ 
    start_time: r.start_time_utc_millis, 
    duration: r.duration, 
    miles: r.length, 
    engaged: r.engagedDuration, 
    userFlags: r.userFlags,
  })))

  return sortedRoutes
}
