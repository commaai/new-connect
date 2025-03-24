import { For, type VoidComponent } from 'solid-js'
import { useLocation } from '@solidjs/router'
import clsx from 'clsx'

import { useDrawerContext } from '~/components/material/Drawer'
import List, { ListItem, ListItemContent } from '~/components/material/List'
import type { Device } from '~/types'
import { getDeviceName, deviceIsOnline } from '~/utils/device'
import storage from '~/utils/storage'

type DeviceListProps = {
  class?: string
  devices: Device[]
}

const DeviceList: VoidComponent<DeviceListProps> = (props) => {
  const location = useLocation()
  const { setOpen } = useDrawerContext()

  const isSelected = (device: Device) => location.pathname.includes(device.dongle_id)
  const onClick = (device: Device) => () => {
    setOpen(false)
    storage.setItem('lastSelectedDongleId', device.dongle_id)
  }

  return (
    <List variant="nav" class={props.class}>
      <For each={props.devices}>
        {(device) => {
          return (
            <ListItem
              variant="nav"
              leading={<div class={clsx('m-2 size-2 shrink-0 rounded-full', deviceIsOnline(device) ? 'bg-green-400' : 'bg-gray-400')} />}
              selected={isSelected(device)}
              onClick={onClick(device)}
              href={`/${device.dongle_id}`}
              activeClass="before:bg-primary"
            >
              <ListItemContent
                headline={getDeviceName(device)}
                subhead={<span class="font-mono text-label-sm lowercase">{device.dongle_id}</span>}
              />
            </ListItem>
          )
        }}
      </For>
    </List>
  )
}

export default DeviceList
