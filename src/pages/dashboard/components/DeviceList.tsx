import { createResource, For, Suspense, type VoidComponent } from 'solid-js'
import { useLocation } from '@solidjs/router'
import clsx from 'clsx'

import { getDevices } from '~/api/devices'
import { useDrawerContext } from '~/components/material/Drawer'
import List, { ListItem, ListItemContent } from '~/components/material/List'
import type { Device } from '~/api/types'
import { getDeviceName, deviceIsOnline } from '~/utils/device'
import storage from '~/utils/storage'

type DeviceListProps = {
  class?: string
}

const DeviceList: VoidComponent<DeviceListProps> = (props) => {
  const location = useLocation()
  const { setOpen } = useDrawerContext()

  const isSelected = (device: Device) => location.pathname.includes(device.dongle_id)
  const onClick = (device: Device) => () => {
    setOpen(false)
    storage.setItem('lastSelectedDongleId', device.dongle_id)
  }

  const [devices] = createResource(getDevices)
  return (
    <List variant="nav" class={props.class}>
      <Suspense fallback={<div class="h-14 skeleton-loader rounded-xl" />}>
        <For each={devices()}>
          {(device) => (
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
          )}
        </For>
      </Suspense>
    </List>
  )
}

export default DeviceList
