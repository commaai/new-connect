import { createResource, Suspense, useContext, Show } from 'solid-js'
import type { VoidComponent } from 'solid-js'

import { getDevice } from '~/api/devices'

import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'
import RouteList from '../components/RouteList'
import { DashboardContext } from '../Dashboard'
import DeviceStatistics from '~/components/DeviceStatistics'
import Typography from '~/components/material/Typography'
import DeviceList from '../components/DeviceList'

import type { Device } from '~/types'

const DashboardDrawer = (props: { devices?: Device[] }) => {
  const hasDevices = props.devices && props.devices.length > 0;

  return (
    <div class='hidden lg:flex flex-col gap-4 w-[378px] ml-[150px]'>
      <div class="p-4 rounded-lg" style={{ background: 'var(--color-surface-container-low)' }}>
        <p class="font-bold mb-4">Devices</p>
        <div class='flex flex-col gap-5 w-full h-[250px] overflow-auto'>
          <Show when={hasDevices}>
            <DeviceList class="w-full" devices={props.devices ?? []} />
          </Show>
          <Show when={!hasDevices}>
            <Typography variant='label-sm'>No devices</Typography>
          </Show>
        </div>
      </div>
      <button class='flex justify-center items-center w-full py-3 text-white rounded-lg text-sm font-semibold bg-surface-container-low hover:bg-slate-800' >
        Add New Device
        <span class="material-symbols-outlined icon-outline ml-3" style={{ "font-size": '22px' }}>
          add
        </span>
      </button>
    </div>
  )
}

type DeviceActivityProps = {
  dongleId: string;
  devices?: Device[];
}

const DeviceActivity: VoidComponent<DeviceActivityProps> = (props) => {
  const { toggleDrawer } = useContext(DashboardContext)!

  const [device] = createResource(() => props.dongleId, getDevice)
  return (
    <>
      <TopAppBar leading={<IconButton onClick={toggleDrawer}>menu</IconButton>}>
        <Suspense fallback={<>Device</>}>{device()?.alias}</Suspense>
      </TopAppBar>
      <div class="flex flex-col gap-4" style={{ height: 'calc(100vh - 4rem)', margin: '0 1rem' }}>
        <div class="h-[72px] rounded-lg bg-surface-container-low">
          <Suspense fallback={<div class="skeleton-loader size-full" />}>
            <div class="p-4">
              <DeviceStatistics dongleId={props.dongleId} />
            </div>
          </Suspense>
        </div>
        <div class='flex gap-x-8 w-full'>
          {device() && <DashboardDrawer devices={props.devices} />}
          <RouteList dongleId={props.dongleId} />
        </div>
      </div>
    </>
  )
}

export default DeviceActivity
