import { Show, VoidComponent, useContext } from 'solid-js'
import { DashboardContext, generateContextType } from '~/pages/dashboard/Dashboard'

const PlaceHolder: VoidComponent = () => {

  const { isDesktop } = useContext(DashboardContext) ?? generateContextType()

  return <Show when={isDesktop()}>
    <div class="flex size-full flex-col items-center justify-center">
      <img
        src="/images/logo-connect-placeholder.svg"
        alt="comma connect"
        width={200}
        height={200}
      />
      <h1 class="text-2xl font-bold text-secondary-container">connect</h1>
      <p class="text-secondary-container">v0.1</p>
      <h2 class="text-xl text-secondary-container">select a drive to view</h2>
    </div>
  </Show>
}

export default PlaceHolder
