import { For } from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

import Icon from '~/components/material/Icon'
import List, { ListItem, ListItemContent } from '~/components/material/List'
import type { DeviceWithFetchedAt } from '~/types'
import { getDeviceName } from '~/utils/device'

import useDeviceList from '~/utils/useDeviceList'

type DeviceListProps = {
  class?: string
  devices: DeviceWithFetchedAt[]
}

const DeviceList: VoidComponent<DeviceListProps> = (props) => {
  const {
    isSelected,
    onClick,
    isOnline,
  } = useDeviceList()
  return (
    <List variant="nav" class={clsx(props.class)}>
      <For each={props.devices}>
        {(device) => {
          return (
            <ListItem
              variant="nav"
              leading={<Icon>directions_car</Icon>}
              selected={isSelected(device)}
              onClick={onClick(device)}
              isOnline={isOnline(device)}
              href={`/${device.dongle_id}`}
            >
              <ListItemContent
                headline={getDeviceName(device)}
                subhead={
                  <span class="font-mono text-label-sm lowercase">
                    {device.dongle_id}
                  </span>
                }
              />
            </ListItem>
          )
        }}
      </For>
    </List >
  )
}

export default DeviceList
