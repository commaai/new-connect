import {
  Accessor,
  createContext,
  createResource,
  createSignal,
  onCleanup,
  Match,
  Setter,
  Show,
  Switch,
} from 'solid-js'
import type { VoidComponent } from 'solid-js'
import { Navigate, useLocation } from '@solidjs/router'

import { getDevices } from '~/api/devices'
import { getProfile } from '~/api/profile'
import type { Device } from '~/types'

import Button from '~/components/material/Button'
import Drawer from '~/components/material/Drawer'
import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'

import DeviceList from './components/DeviceList'
import DeviceActivity from './activities/DeviceActivity'
import RouteActivity from './activities/RouteActivity'

type DashboardState = {
  drawer: Accessor<boolean>
  setDrawer: Setter<boolean>
  toggleDrawer: () => void
}

export const DashboardContext = createContext<DashboardState>()

const [isLargeScreen, setIsLargeScreen] = createSignal(false)

const mql = window.matchMedia('(min-width: 1024px)')
setIsLargeScreen(mql.matches)
mql.addEventListener('change', (e) => setIsLargeScreen(e.matches))

onCleanup(() => mql.removeEventListener('change', (e) => setIsLargeScreen(e.matches)))

const DashboardDrawer = (props: {
  onClose: () => void
  devices: Device[] | undefined
}) => {
  return (
    <>
      <TopAppBar
        component="h1"
        leading={<IconButton onClick={props.onClose}>arrow_back</IconButton>}
      >
        comma connect
      </TopAppBar>
      <h2 class="mx-4 mb-2 text-label-sm">
        Devices
      </h2>
      <Show when={props.devices} keyed>
        {(devices: Device[]) => <DeviceList class="gap-3 p-2" devices={devices} />}
      </Show>
      <div class="grow" />
      <hr class="mx-4 opacity-20" />
      <Button class="m-4" href="/logout">Sign out</Button>
    </>
  )
}

const DashboardLayout: VoidComponent = () => {
  const location = useLocation()

  const pathParts = () => location.pathname.split('/').slice(1).filter(Boolean)
  const dongleId = () => pathParts()[0]
  const dateStr = () => pathParts()[1]

  const [drawer, setDrawer] = createSignal(false)
  const onOpen = () => setDrawer(true)
  const onClose = () => setDrawer(false)
  const toggleDrawer = () => setDrawer((prev) => !prev)

  const [devices] = createResource(getDevices)
  const [profile] = createResource(getProfile)

  return (
    <DashboardContext.Provider value={{ drawer, setDrawer, toggleDrawer }}>
      <Drawer
        open={drawer()}
        onOpen={onOpen}
        onClose={onClose}
        drawer={<DashboardDrawer onClose={onClose} devices={devices()} />}
      >
        <Switch
          fallback={
            <>
              <TopAppBar
                leading={<IconButton onClick={toggleDrawer}>menu</IconButton>}
              >
                No device
              </TopAppBar>
            </>
          }
        >
          <Match when={!!profile.error}>
            <Navigate href="/login" />
          </Match>
          <Match when={dateStr()} keyed>
            {!isLargeScreen() && <RouteActivity dongleId={dongleId()} dateStr={dateStr()} />}
            {isLargeScreen() && <DeviceActivity devices={devices()} dongleId={dongleId()} dateStr={dateStr()} />}
          </Match>
          <Match when={dongleId()} keyed>
            <DeviceActivity dongleId={dongleId()} devices={devices()} />
          </Match>
          <Match when={devices()?.length} keyed>
            <Navigate href={`/${devices()![0].dongle_id}`} />
          </Match>
        </Switch>
      </Drawer>
    </DashboardContext.Provider>
  )
}

export default DashboardLayout
