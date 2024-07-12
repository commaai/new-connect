import { DeviceWithFetchedAt } from '~/types'
import { useLocation } from '@solidjs/router'
import { useContext } from 'solid-js'
import storage from './storage'
import { deviceIsOnline } from './device'
import { DashboardContext } from '~/pages/dashboard/Dashboard'

export default function useDeviceList() {
  const { setDrawer } = useContext(DashboardContext)!
  const location = useLocation()

  const isSelected = (device: DeviceWithFetchedAt): boolean => {
    return location.pathname.includes(device.dongle_id)
  }

  const onClick = (device: DeviceWithFetchedAt): () => void => {
    return () => {
      setDrawer(false)
      storage.setItem('lastSelectedDongleId', device.dongle_id)
    }
  }

  const isOnline = (device: DeviceWithFetchedAt): boolean => {
    return deviceIsOnline(device)
  }

  return {
    isSelected,
    onClick,
    isOnline,
  }
}
