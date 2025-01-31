import { Device } from '~/types'
import { useLocation } from '@solidjs/router'
import { useContext } from 'solid-js'
import storage from './storage'
import { DashboardContext } from '~/pages/dashboard/Dashboard'

export default function useDeviceList() {
  const { toggleDrawer, isDesktop } = useContext(DashboardContext)!
  const location = useLocation()

  const isSelected = (device: Device) => {
    return location.pathname.includes(device.dongle_id)
  }

  const onClick = (device: Device) => {
    return () => {
      if (!isDesktop()) {
        toggleDrawer()
      }
      storage.setItem('lastSelectedDongleId', device.dongle_id)
    }
  }

  return {
    isSelected,
    onClick,
  }
}
