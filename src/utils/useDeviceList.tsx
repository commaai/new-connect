import { useLocation } from '@solidjs/router'

import { useDrawerContext } from '~/components/material/Drawer'
import type { Device } from '~/types'
import storage from './storage'

export default function useDeviceList() {
  const { setOpen } = useDrawerContext()
  const location = useLocation()

  const isSelected = (device: Device) => {
    return location.pathname.includes(device.dongle_id)
  }

  const onClick = (device: Device) => {
    return () => {
      setOpen(false)
      storage.setItem('lastSelectedDongleId', device.dongle_id)
    }
  }

  return {
    isSelected,
    onClick,
  }
}
