import {
  createContext,
  createResource,
  createSignal,
  onCleanup,
  Show,
  onMount,
  createEffect,
} from 'solid-js'
import { Navigate, useParams, useNavigate } from '@solidjs/router'

import { getDevices, getDevice } from '~/api/devices'
import { getProfile } from '~/api/profile'

import { Controls } from '~/pages/dashboard/components/Controls'
import Search from './components/Search'
import RouteList from './components/RouteList'
import Loader from '~/components/Loader'
import PlaceHolder from '~/components/PlaceHolder'
import RouteActivity from './activities/RouteActivity'

const MAX_WIDTH = 30
const MIN_WIDTH = 20

// adapted from https://www.solidjs.com/guides/typescript#context
// TODO: find a better way to type annotate context without child components complaining DashboardState | undefined 
export const generateContextType = () => {
  const params = useParams()
  const [dongleId] = createSignal<string | undefined>(params.dongleId)
  const [width] = createSignal(MAX_WIDTH)
  const [route] = createSignal<string | undefined>(params.route)
  const [device] = createResource(() => dongleId(), getDevice)
  const [isDesktop] = createSignal(window.innerWidth > 1024)

  return {width, isDesktop, device, route} as const
}

type DashboardState = ReturnType<typeof generateContextType>
export const DashboardContext = createContext<DashboardState>()

function DashboardLayout() {
  const navigate = useNavigate()
  const params = useParams()
  
  const [dongleId, setDongleId] = createSignal<string | undefined>(params.dongleId)
  const [route] = createSignal<string | undefined>(params.route)

  const [devices] = createResource(getDevices)
  const [profile] = createResource(getProfile)
  const [device] = createResource(() => dongleId(), getDevice)

  const [leftContainerWidth, setLeftContainerWidth] = createSignal(MAX_WIDTH)
  const [isDesktop, setView] = createSignal(window.innerWidth > 1024)

  const [searchQuery, setSearchQuery] = createSignal('')

  onMount(() => {
    window.addEventListener('resize', () => {
      setView(window.innerWidth > 1024)
    })
  })

  createEffect(() => {
    const deviceList = devices.latest
    if (!dongleId() && deviceList && deviceList.length > 0) {
      setDongleId(deviceList[1].dongle_id)
      navigate(`/${deviceList[1].dongle_id}`)
    }
  })

  onCleanup(() => {
    window.removeEventListener('resize', () => {})
  })

  const handleResize = (e: { clientX: number, preventDefault: () => void }) => {
    const offset = (e.clientX / window.innerWidth) * 100
    setLeftContainerWidth(Math.min(Math.max(offset, MIN_WIDTH), MAX_WIDTH))
    e.preventDefault()
  }

  return (
    <DashboardContext.Provider
      value={{ width: leftContainerWidth, isDesktop, device, route }}
    >
      <Show when={!profile.error} fallback={<Navigate href="/login" />}>
        <div class="flex size-full">
          <div style={{ width: isDesktop() ? `${leftContainerWidth()}%` : route() ? '0%' : '100%' }} class={'flex h-screen flex-col overflow-hidden p-4'}>
            <Search onSearch={setSearchQuery} />
            <Show when={dongleId()} fallback={<div class="flex size-full items-center justify-center"><Loader /></div>}>
              <div class={'size-full flex-col overflow-y-auto'}>
                <RouteList searchQuery={searchQuery()} dongleId={dongleId()} />
              </div>
            </Show>
            <Controls devices={devices} />
          </div>
          <Show when={isDesktop()}><div class="h-screen w-0.5 cursor-ew-resize bg-gray-800 hover:w-2" draggable="true" onDragEnd={handleResize} />          </Show>
          <div style={{ width: isDesktop() ? `${100 - leftContainerWidth()}%` : route() ? '100%' : '0%' }} class={isDesktop() ? 'p-4' : 'p-0'}>
            <Show when={route()} fallback={<PlaceHolder />}>
              <RouteActivity dongleId={dongleId()} dateStr={route()} />
            </Show>
          </div>
        </div>
      </Show>
    </DashboardContext.Provider>
  )
}

export default DashboardLayout
