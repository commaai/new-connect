import { createResource, Suspense, useContext } from 'solid-js'
import type { VoidComponent } from 'solid-js'

import { getDevice } from '~/api/devices'

import Icon from '~/components/material/Icon'
import TopAppBar from '~/components/material/TopAppBar'
import Typography from '~/components/material/Typography'
import DeviceStatistics from '~/components/DeviceStatistics'

import RouteList from '../components/RouteList'
import { DashboardContext } from '../Dashboard'

type DeviceActivityProps = {
  dongleId: string
}

const DeviceActivity: VoidComponent<DeviceActivityProps> = (props) => {
  const { toggleDrawer } = useContext(DashboardContext)!

  const [device] = createResource(() => props.dongleId, getDevice)
  return (
    <>
      <TopAppBar leading={<md-icon-button onClick={toggleDrawer}><Icon>menu</Icon></md-icon-button>}>
        <Suspense fallback={<>Device</>}>{device()?.alias}</Suspense>
      </TopAppBar>
      <div class="flex flex-col gap-4 px-4 pb-4">
        <div class="h-[72px] overflow-hidden rounded-lg bg-surface-container">
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
