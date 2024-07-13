import { DeviceWithFetchedAt } from '~/types'
import { useLocation } from '@solidjs/router'
import { useContext } from 'solid-js'
import storage from './storage'
import { DashboardContext } from '~/pages/dashboard/Dashboard'

export default function useDeviceList() {
  const { setDrawer } = useContext(DashboardContext)!
  const location = useLocation()

  const isSelected = (device: DeviceWithFetchedAt) => {
    return location.pathname.includes(device.dongle_id)
  }

  const onClick = (device: DeviceWithFetchedAt) => {
    return () => {
      setDrawer(false)
      storage.setItem('lastSelectedDongleId', device.dongle_id)
    }
  }

  return {
    isSelected,
    onClick,
  }
}
