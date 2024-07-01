import { createEffect, createSignal, For, Show, useContext } from 'solid-js'
import type { VoidComponent, Resource } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import Avatar from '~/components/material/Avatar'
import Icon from '~/components/material/Icon'
import Dates from '../../../components/Dates'
import { DashboardContext, generateContextType } from '../Dashboard'
import { Device } from '~/types'
import { getDeviceName } from '~/utils/device'
import DeviceStatistics from '~/components/DeviceStatistics'

type SelectorProps = {
  onUiChange: (change: boolean) => void,
  data: Device[]
}

const DeviceSelector: VoidComponent<SelectorProps> = (props) => {

  const { device } = useContext(DashboardContext) ?? generateContextType()
  const navigate = useNavigate()

  const [isSelectorOpen, openSelector] = createSignal(false)
  // eslint-disable-next-line solid/reactivity
  const [data] = createSignal(props.data)

  createEffect(() => props.onUiChange(isSelectorOpen()))

  return <>
    <div class="flex w-2/12 items-center justify-center">
      <Icon class="text-on-secondary-container">directions_car</Icon>
    </div>
    <div class="h-full max-h-52 w-8/12 overflow-y-auto">
      <Show 
        when={isSelectorOpen()}
        fallback={<div class="flex h-16 w-full flex-col justify-center">
          <Show when={!device.loading && device.latest}>
            <h2>{getDeviceName(device.latest)}</h2>
            <p class="text-on-secondary-container">{device.latest?.dongle_id}</p>
          </Show>
        </div>}
      >
        <For each={data()}>
          {(item) => {
            return <div 
              onClick={() => {
                openSelector(false)
                navigate(`/${item.dongle_id}`)
                setTimeout(() => window.location.reload(), 200)
              }} 
              class="flex h-16 w-full flex-col justify-center rounded-md pl-3 hover:bg-on-secondary-container">
              <h2>{getDeviceName(item)}</h2>
              <p class="text-on-secondary-container">{item.dongle_id}</p>
            </div>
          }}
        </For>
        <div onClick={() => openSelector(false)} 
          class="flex h-16 w-full items-center space-x-2 rounded-md pl-3 hover:bg-on-secondary-container">
          <Icon class="text-on-secondary-container" size="40">add</Icon>
          <h2 class="text-on-secondary-container">Add device</h2>
        </div>
      </Show>
    </div>
    <div onClick={() => openSelector(!isSelectorOpen())} class="flex w-2/12 items-center justify-center">
      <Avatar class="bg-transparent hover:bg-neutral-600">
        <Icon>{isSelectorOpen() ? 'keyboard_arrow_down' : 'keyboard_arrow_up'}</Icon>
      </Avatar>
    </div>
  </>
}

type Props = {
  devices: Resource<Device[] | never[]>,
}

export const Controls: VoidComponent<Props> = (props) => {

  const { width, isDesktop, device } = useContext(DashboardContext) ?? generateContextType()
  const [isSelectorOpen, setSelector] = createSignal(false)

  return <Show 
    when={!props.devices.loading}
  >
    <div style={{ width: !isDesktop() ? '95%' : `${width() - 2}%` }} class={`absolute bottom-5 left-3 z-10 flex animate-load-bounce sm:left-4 ${isSelectorOpen() ? 'h-1/4' : 'h-52'} flex-col overflow-hidden rounded-md bg-secondary-container transition-controls ${isSelectorOpen() ? 'md:h-96' : 'md:h-60'}`}>
      <div class={`mt-4 flex ${isSelectorOpen() ? 'basis-2/3' : 'basis-1/3'} flex-row`}>
        <DeviceSelector 
          onUiChange={change => setSelector(change)}
          data={props.devices.latest || []}
        />
      </div>
      <DeviceStatistics device={device()} class={isSelectorOpen() ? 'basis-1/3' : 'basis-2/3'} />
      <div class={`flex items-center justify-center ${isSelectorOpen() ? 'basis-1/3' : 'basis-2/3'}`}>
        <Dates />
      </div>
    </div>
  </Show>
}
