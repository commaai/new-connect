import { useContext, For } from 'solid-js'
import type { VoidComponent } from 'solid-js'
import { useLocation } from '@solidjs/router'

import type { Device } from '~/types'

import Icon from '~/components/material/Icon'
import Typography from '~/components/material/Typography'
import { DashboardContext } from '../Dashboard'

type DeviceListProps = {
  class?: string
  devices: Device[]
}

const DeviceList: VoidComponent<DeviceListProps> = (props) => {
  const { setDrawer } = useContext(DashboardContext)!
  const location = useLocation()

  return (
    <md-list class={props.class}>
      <For each={props.devices}>
        {(device) => {
          const isSelected = () => location.pathname.includes(device.dongle_id)
          const onClick = () => setDrawer(false)
          return (
            <md-list-item
              type="text"
              selected={isSelected()}
              onClick={onClick}
              href={`/${device.dongle_id}`}
            >
              <Icon slot="start">directions_car</Icon>
              <Typography color="on-surface" variant="body-lg" as="div">
                {device.alias}
              </Typography>
              <Typography class="lowercase" color="on-surface-variant" variant="label-sm" as="div">
                {device.dongle_id}
              </Typography>
            </md-list-item>
          )
        }}
      </For>
    </md-list>
  )
}

export default DeviceList
