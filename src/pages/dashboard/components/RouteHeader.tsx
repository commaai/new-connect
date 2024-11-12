import dayjs from 'dayjs'
import Avatar from '~/components/material/Avatar'
import { CardHeader } from '~/components/material/Card'
import Icon from '~/components/material/Icon'
import type { RouteSegments } from '~/types'

export const RouteHeader = (props: { route: RouteSegments }) => {
  const startTime = () => dayjs(props.route.start_time_utc_millis ?? props.route.create_time * 1000)
  const endTime = () => dayjs(props.route.end_time_utc_millis)

  const headline = () => startTime().format('ddd, MMM D, YYYY')
  const subhead = () => {
    const startFormatted = startTime().format('h:mm A')
    return props.route.end_time_utc_millis ? `${startFormatted} to ${endTime().format('h:mm A')}` : startFormatted
  }

  return (
    <CardHeader
      headline={headline()}
      subhead={subhead()}
      leading={
        <Avatar>
          <Icon>directions_car</Icon>
        </Avatar>
      }
    />
  )
}
