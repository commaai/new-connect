import { For } from 'solid-js'
import type { VoidComponent } from 'solid-js'
import clsx from 'clsx'

import List, { ListItem, ListItemContent } from '~/components/material/List'
import type { Device } from '~/types'
import { getDeviceName, deviceIsOnline } from '~/utils/device'
import useDeviceList from '~/utils/useDeviceList'

type DeviceListProps = {
  class?: string
  devices: Device[]
}

const DeviceList: VoidComponent<DeviceListProps> = (props) => {
  const {
    isSelected,
    onClick,
  } = useDeviceList()
  return (
    <List variant="nav" class={props.class}>
      <For each={props.devices}>
        {(device) => {
          return (
            <ListItem
              variant="nav"
              leading={<div class={clsx(
                'm-2 size-2 rounded-full',
                deviceIsOnline(device) ? 'bg-green-400' : 'bg-gray-400',
              )} />}
              selected={isSelected(device)}
              onClick={onClick(device)}
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
    </List>
  )
}

export default DeviceList
