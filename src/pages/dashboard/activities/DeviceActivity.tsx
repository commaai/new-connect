import { createResource, Suspense, useContext } from 'solid-js'
import type { VoidComponent } from 'solid-js'

import { getDevice } from '~/api/devices'

import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'
import Typography from '~/components/material/Typography'
import RouteList from '../components/RouteList'
import { DashboardContext } from '../Dashboard'
import DeviceStatistics from '~/components/DeviceStatistics'

type DeviceActivityProps = {
  dongleId: string
}

const DeviceActivity: VoidComponent<DeviceActivityProps> = (props) => {
  const { toggleDrawer } = useContext(DashboardContext)!

  const [device] = createResource(() => props.dongleId, getDevice)
  return (
    <>
      <TopAppBar leading={<IconButton onClick={toggleDrawer}>menu</IconButton>}>
        <Suspense fallback={<>Device</>}>{device()?.alias}</Suspense>
      </TopAppBar>
      <div class="flex flex-col gap-4 px-4 pb-4">
        <div class="h-[72px] overflow-hidden rounded-lg bg-surface-1">
          <Suspense fallback={<div class="skeleton-loader size-full" />}>
            <div class="p-4">
              <DeviceStatistics dongleId={props.dongleId} />
            </div>
          </Suspense>
        </div>
        <div class="flex flex-col gap-2">
          <Typography variant="label-sm">Routes</Typography>
          <RouteList dongleId={props.dongleId} />
        </div>
      </div>
    </>
  )
}

export default DeviceActivity
