import { createResource, Suspense, useContext } from 'solid-js'
import type { VoidComponent } from 'solid-js'

import { getDevice } from '~/api/devices'

import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'
import DeviceStatistics from '~/components/DeviceStatistics'
import { getDeviceName } from '~/utils/device'

import RouteList from '../components/RouteList'
import { DashboardContext } from '../Dashboard'
import DeviceMap from '~/components/DeviceMap'

type DeviceActivityProps = {
  dongleId: string
}

const DeviceActivity: VoidComponent<DeviceActivityProps> = (props) => {
  const { toggleDrawer } = useContext(DashboardContext)!

  const [device] = createResource(() => props.dongleId, getDevice)
  const [deviceName] = createResource(device, getDeviceName)
  return (
    <>
      <TopAppBar leading={<IconButton onClick={toggleDrawer}>menu</IconButton>}>
        {deviceName()}
      </TopAppBar>
      <div class="flex flex-col gap-4 px-4 pb-4">
        <div class="h-[300px] overflow-hidden rounded-lg bg-surface-container-low">
          <DeviceMap device={device.latest} />
          <Suspense fallback={<div class="skeleton-loader h-1/4 w-full" />}>
            <div class="p-4">
              <DeviceStatistics dongleId={props.dongleId} />
            </div>
          </Suspense>
        </div>
        <div class="flex flex-col gap-2">
          <span class="text-label-sm">Routes</span>
          <RouteList dongleId={props.dongleId} />
        </div>
      </div>
    </>
  )
}

export default DeviceActivity
