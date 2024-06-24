import type { RouteSegments } from '~/types'
import { fetcher } from '.'
import { formatRouteDistance, getRouteDuration } from '~/utils/date'
import { TimelineStatistics, getTimelineStatistics } from '~/api/derived'
import { getPlaceFromCoords } from '~/map'

const formatEngagement = (timeline?: TimelineStatistics): number => {
  if (!timeline) return 0
  const { engagedDuration, duration } = timeline
  return parseInt((100 * (engagedDuration / duration)).toFixed(0))
}
  
const formatUserFlags = (timeline?: TimelineStatistics): number => {
  return timeline?.userFlags ?? 0
}

const endpoint = (dongleId: string | undefined, page_size: number) => `/v1/devices/${dongleId}/routes_segments?limit=${page_size}`
export const getKey = (
  dongleId:string | undefined, page_size: number, previousPageData?: RouteSegments[],
): string | undefined => {
  if (!previousPageData && dongleId) return endpoint(dongleId, page_size)
  if(previousPageData) { // just to satisfy typescript
    if (previousPageData.length === 0) return undefined
    const lastSegmentEndTime = previousPageData.at(-1)!.segment_start_times.at(-1)!
    return `${endpoint(dongleId, page_size)}&end=${lastSegmentEndTime - 1}`
  }
}

export const getRouteCardsData = async (url: string | undefined): Promise<RouteSegments[]> => {
  if (!url) return []
  
  try {
    const res = await fetcher<RouteSegments[]>(url)
  
    const updatedRes = await Promise.all(res.map(async (each) => {
      const [startPlace, endPlace, timeline] = await Promise.all([
        getPlaceFromCoords(each.start_lng, each.start_lat),
        getPlaceFromCoords(each.end_lng, each.end_lat),
        getTimelineStatistics(each),
      ])
  
      each.ui_derived = {
        distance: formatRouteDistance(each),
        duration: getRouteDuration(each),
        flags: formatUserFlags(timeline),
        engagement: formatEngagement(timeline),
        address: {
          start: startPlace,
          end: endPlace,
        },
      }
  
      return each
    }))
  
    return updatedRes
  } catch (err) {
    console.error(err)
    return []
  }
}
