import type { Component, JSXElement, VoidComponent } from 'solid-js'
import { createResource, lazy, Match, Show, SuspenseList, Switch } from 'solid-js'
import { Navigate, type RouteSectionProps, useLocation } from '@solidjs/router'
import clsx from 'clsx'

import { getDevices } from '~/api/devices'
import { getProfile } from '~/api/profile'
import { getGravatarUrl } from '~/utils/profile'
import storage from '~/utils/storage'

import Avatar from '~/components/material/Avatar'
import Button from '~/components/material/Button'
import Drawer, { DrawerToggleButton, useDrawerContext } from '~/components/material/Drawer'
import Icon from '~/components/material/Icon'
import IconButton from '~/components/material/IconButton'
import Menu, { MenuItem } from '~/components/material/Menu'
import * as Popover from '~/components/material/Popover'
import TopAppBar from '~/components/material/TopAppBar'

import DeviceList from './components/DeviceList'
import DeviceActivity from './activities/DeviceActivity'
import RouteActivity from './activities/RouteActivity'
import SettingsActivity from './activities/SettingsActivity'

const PairActivity = lazy(() => import('./activities/PairActivity'))

const DashboardDrawer: VoidComponent = () => {
  const { modal, setOpen } = useDrawerContext()
  const onClose = () => setOpen(false)

  const [profile] = createResource(getProfile)
  const [gravatarUrl] = createResource(
    () => profile()?.email,
    (email) => getGravatarUrl(email),
  )

  return (
    <>
      <TopAppBar
        component="h1"
        leading={
          <Show when={modal()}>
            <IconButton name="arrow_back" onClick={onClose} />
          </Show>
        }
      >
        comma connect
      </TopAppBar>
      <h2 class="mx-4 mb-2 text-label-sm uppercase">Devices</h2>
      <DeviceList class="overflow-y-auto p-2" />
      <div class="grow" />
      <Button class="m-4" leading={<Icon name="add" />} href="/pair" onClick={onClose}>
        Add new device
      </Button>
      <hr class="mx-4 opacity-20" />
      <div class="flex items-center gap-2 px-4 justify-between rounded-md m-4 outline outline-1 outline-outline-variant min-h-14 xs:h-20">
        <Avatar class="hidden xs:block overflow-hidden shrink-0">
          <Show when={gravatarUrl()} keyed>
            {(url) => <img alt="Your gravatar profile image" src={url} />}
          </Show>
        </Avatar>
        <div class="min-w-0">
          <div class="truncate text-body-md text-on-surface">{profile()?.email}</div>
          <div class="truncate text-label-sm text-on-surface-variant">{profile()?.user_id}</div>
        </div>
        <Popover.Root>
          <Popover.Trigger>
            <Icon class="state-layer p-2 before:rounded-full before:bg-on-surface" name="more_vert" />
            <span class="sr-only">User settings</span>
          </Popover.Trigger>
          <Popover.Content position="top">
            <Menu>
              <MenuItem href="/logout" leading={<Icon name="logout" />}>
                Logout
              </MenuItem>
            </Menu>
          </Popover.Content>
        </Popover.Root>
      </div>
    </>
  )
}

const DashboardLayout: Component<{
  paneOne: JSXElement
  paneTwo: JSXElement
  paneTwoContent: boolean
}> = (props) => {
  return (
    <div class="relative size-full overflow-hidden">
      <div
        class={clsx(
          'mx-auto size-full max-w-[1560px] md:grid md:grid-cols-2 lg:gap-2',
          // Flex layout for mobile with horizontal transition
          'flex transition-transform duration-300 ease-in-out',
          props.paneTwoContent ? '-translate-x-full md:translate-x-0' : 'translate-x-0',
        )}
      >
        <SuspenseList revealOrder="forwards">
          <div class="min-w-full overflow-y-scroll">{props.paneOne}</div>
          <div class="min-w-full overflow-y-scroll">{props.paneTwo}</div>
        </SuspenseList>
      </div>
    </div>
  )
}

const Dashboard: Component<RouteSectionProps> = () => {
  const location = useLocation()

  const pathParts = () => location.pathname.split('/').slice(1).filter(Boolean)
  const dongleId = () => pathParts()[0]
  const dateStr = () => pathParts()[1]
  const startTime = () => (pathParts()[2] ? Number(pathParts()[2]) : 0)

  const pairToken = () => !!location.query.pair

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
    <Drawer drawer={<DashboardDrawer />}>
      <Switch fallback={<TopAppBar leading={<DrawerToggleButton />}>No device</TopAppBar>}>
        <Match when={!!profile.error}>
          <Navigate href="/login" />
        </Match>
        <Match when={dongleId() === 'pair' || pairToken()}>
          <PairActivity />
        </Match>
        <Match when={dongleId()} keyed>
          {(id) => (
            <DashboardLayout
              paneOne={<DeviceActivity dongleId={id} />}
              paneTwo={
                <Switch
                  fallback={
                    <div class="hidden size-full flex-col items-center justify-center gap-4 md:flex">
                      <Icon name="search" size="48" />
                      <span class="text-title-md">Select a route to view</span>
                    </div>
                  }
                >
                  <Match when={dateStr() === 'settings' || dateStr() === 'prime'}>
                    <SettingsActivity dongleId={id} />
                  </Match>
                  <Match when={dateStr()} keyed>
                    {(date) => <RouteActivity dongleId={id} dateStr={date} startTime={startTime()} />}
                  </Match>
                </Switch>
              }
              paneTwoContent={!!dateStr()}
            />
          )}
        </Match>
        <Match when={getDefaultDongleId()} keyed>
          {(defaultDongleId) => <Navigate href={`/${defaultDongleId}`} />}
        </Match>
      </Switch>
    </Drawer>
  )
}

export default Dashboard
