import {
  createContext,
  createResource,
  createSignal,
  lazy,
  Match,
  Show,
  Switch,
} from 'solid-js'
import type { Component } from 'solid-js'
import { Navigate, type RouteSectionProps, useLocation } from '@solidjs/router'

import { getDevices } from '~/api/devices'
import { getProfile } from '~/api/profile'
import type { Device } from '~/types'

import Button from '~/components/material/Button'
import Drawer from '~/components/material/Drawer'
import Icon from '~/components/material/Icon'

import DeviceList from './components/DeviceList'
import DeviceActivity from './activities/DeviceActivity'
import RouteActivity from './activities/RouteActivity'
import SettingsActivity from './activities/SettingsActivity'
import storage from '~/utils/storage'
import TopHeader from '~/components/TopHeader'
import TopAppBar from '~/components/material/TopAppBar'
import { useDimensions } from '~/utils/window'

const PairActivity = lazy(() => import('./activities/PairActivity'))

const DESKTOP_THRESHOLD = 768

type DashboardState = {
  isDrawerOpen: () => boolean
  toggleDrawer: () => void
  isDesktop: () => boolean
  showHeader: () => boolean
}

export const DashboardContext = createContext<DashboardState>()

const DashboardDrawer = (props: {
  onClose: () => void
  devices: Device[] | undefined
}) => {
  return (
    <>
      <h2 class="mx-4 mb-2 mt-4 text-label-sm">
        Devices
      </h2>
      <Show when={props.devices} keyed>
        {devices => <DeviceList class="p-2" devices={devices} />}
      </Show>
      <div class="grow" />
      <Button class="m-4" leading={<Icon>add</Icon>} href="/pair" onClick={props.onClose}>
        Add new device
      </Button>
      <hr class="mx-4 opacity-20" />
      <Button class="m-4" color="error" href="/logout">Sign out</Button>
    </>
  )
}

const DashboardLayout: Component<RouteSectionProps> = () => {
  const location = useLocation()
  const dimensions = useDimensions()

  const pathParts = () => location.pathname.split('/').slice(1).filter(Boolean)
  const dongleId = () => pathParts()[0]
  const dateStr = () => pathParts()[1]

  const pairToken = () => !!location.query['pair']

  const isDesktop = () => dimensions().width >= DESKTOP_THRESHOLD
  const [isDrawerOpen, setIsDrawerOpen] = createSignal(false)
  
  const toggleDrawer = () => {
    if (!isDesktop()) {
      setIsDrawerOpen(prev => !prev)
    }
  }

  const showHeader = () => isDesktop() || (!dateStr() && dongleId() !== 'pair')

  const [devices] = createResource(getDevices)
  const [profile] = createResource(getProfile)

  const getDefaultDongleId = () => {
    // Do not redirect if dongle ID already selected
    if (dongleId()) return undefined

    const lastSelectedDongleId = storage.getItem('lastSelectedDongleId')
    if (devices()?.some((device) => device.dongle_id === lastSelectedDongleId)) return lastSelectedDongleId
    return devices()?.[0]?.dongle_id
  }

  return (
    <DashboardContext.Provider value={{ isDrawerOpen, toggleDrawer, isDesktop, showHeader }}>
      <Show when={showHeader()}>
        <TopHeader />
      </Show>
      <Drawer
        open={isDrawerOpen() || isDesktop()}
        onClose={() => setIsDrawerOpen(false)}
        drawer={<DashboardDrawer onClose={() => setIsDrawerOpen(false)} devices={devices()} />}
      >
        <Switch
          fallback={
            <TopAppBar
              leading={<Icon class="text-yellow-400">warning</Icon>}
            >
              No device
            </TopAppBar>
          }
        >
          <Match when={!!profile.error}>
            <Navigate href="/login" />
          </Match>
          <Match when={dongleId() === 'pair' || pairToken()}>
            <PairActivity />
          </Match>
          <Match when={dateStr() === 'settings' || dateStr() === 'prime'}>
            <SettingsActivity dongleId={dongleId()} />
          </Match>
          <Match when={dateStr()} keyed>
            <RouteActivity dongleId={dongleId()} dateStr={dateStr()} />
          </Match>
          <Match when={dongleId()} keyed>
            <DeviceActivity dongleId={dongleId()} />
          </Match>
          <Match when={getDefaultDongleId()} keyed>{(defaultDongleId) => (
            <Navigate href={`/${defaultDongleId}`} />
          )}</Match>
        </Switch>
      </Drawer>
    </DashboardContext.Provider>
  )
}

export default DashboardLayout
