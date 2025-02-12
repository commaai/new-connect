import {  type VoidComponent } from 'solid-js'
import clsx from 'clsx'
import RouteStatistics from './RouteStatistics'
import type { Route } from '~/types'

type RouteInfoProps = {
  class?: string
  route?: Route
}

const RouteInfo: VoidComponent<RouteInfoProps> = (props) => {
  return (
    <div class={clsx(
      'flex flex-col rounded-md border-2 border-surface-container-high bg-surface-container-lowest p-4',
      props.class,
    )}>
      <RouteStatistics route={props.route} />
    </div>
  )
}

export default RouteInfo 
