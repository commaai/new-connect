import { createResource, Suspense, useContext, Show } from 'solid-js'
import type { VoidComponent } from 'solid-js'

import { getDevice } from '~/api/devices'

import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'
import { getDeviceName } from '~/utils/device'

import RouteList from '../components/RouteList'
import { DashboardContext } from '../Dashboard'
import DeviceStatistics from '~/components/DeviceStatistics'
import DeviceList from '../components/DeviceList'
import RouteActivity from './RouteActivity'

import type { Device } from '~/types'

const DashboardDrawer = (props: { devices?: Device[] }) => {
  return (
    <div class="hidden w-[350px] flex-col gap-4 lg:flex">
      <div class="rounded-lg bg-surface-container-low p-4">
        <p class="mb-4 font-bold">Devices</p>
        <div class="flex h-[250px] w-full flex-col overflow-auto">
          <Show when={props.devices && props.devices.length > 0}>
            <DeviceList class="w-full gap-3" devices={props.devices ?? []} />
          </Show>
          <Show when={!props.devices || props.devices.length === 0}>
            <p>No devices</p>
          </Show>
        </div>
      </div>
      <button class="flex w-full items-center justify-center rounded-lg bg-surface-container-low py-3 text-sm font-semibold text-white hover:bg-slate-800" >
        Add New Device
        <span class="material-symbols-outlined icon-outline ml-3" style={{ 'font-size': '22px' }}>
          add
        </span>
      </button>
    </div>
  )
}

type DeviceActivityProps = {
  devices?: Device[];
  dongleId: string;
  dateStr?: string;
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
      <div class="flex flex-col gap-4 px-4">
        <div class="h-[72px] overflow-hidden rounded-lg bg-surface-container-low">
          <Suspense fallback={<div class="skeleton-loader size-full" />}>
            <div class="p-4">
              <DeviceStatistics dongleId={props.dongleId} />
            </div>
          </Suspense>
        </div>
        <div class="flex w-full justify-center gap-x-[40px]">
          {device() && <DashboardDrawer devices={props.devices} />}
          <RouteList dongleId={props.dongleId} width={props.dateStr ? 'w-fit' : 'w-full'} />
          {!!props.dateStr && <RouteActivity dongleId={props.dongleId} dateStr={props.dateStr} viewType="large"/>}
        </div>
      </div>
    </>
  )
}

export default DeviceActivity
