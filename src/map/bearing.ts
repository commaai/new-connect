import type { GPSPathPoint } from '~/api/derived'

const calculateBearing = (start: GPSPathPoint, end: GPSPathPoint) => {

  const radians = (degree: number): number => degree * (Math.PI / 180.0)
  const degrees = (radian: number): number => radian * (180.0 / Math.PI)

  const startLat = radians(start.lat)
  const startLng = radians(start.lng)
  const endLat = radians(end.lat)
  const endLng = radians(end.lng)
  

  const dLng = endLng - startLng
  const dPhi = Math.log(Math.tan(endLat / 2 + Math.PI / 4) / Math.tan(startLat / 2 + Math.PI / 4))

  const bearing = degrees(Math.atan2(
    Math.abs(dLng) > Math.PI ? (dLng > 0 ? -(2 * Math.PI - dLng) : (2 * Math.PI + dLng)) : dLng, dPhi,
  ))

  return (bearing + 360) % 360
}

export const calculateAverageBearing = (points: GPSPathPoint[]): number => 
  points.length < 2 ? 0 : 
    points.slice(0, -1)
      .reduce((sum, point, i) => sum + calculateBearing(point, points[i + 1]), 0) / (points.length - 1)
