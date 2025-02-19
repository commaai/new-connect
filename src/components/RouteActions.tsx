import { createSignal, Show, type VoidComponent, createEffect, createResource } from 'solid-js'
import Icon from '~/components/material/Icon'
import { setRoutePublic, setRoutePreserved, getRoute, getPreservedRoutes } from '~/api/route'

interface RouteActionsProps {
  routeName: string
}

const ToggleButton: VoidComponent<{
  label: string
  active: boolean | undefined
  onToggle: () => void
}> = (props) => (
  <button
    class="flex w-full items-center justify-between px-5 py-3 transition-colors hover:bg-surface-container-low"
    onClick={() => props.onToggle()}
  >
    <span class="text-body-lg">{props.label}</span>

    {/* Toggle Switch */}
    <div
      class={`relative h-7 w-12 rounded-full border-2 transition-colors ${
        props.active ? 'border-green-300 bg-green-300' : 'border-surface-container-high'
      }`}
    >
      <div
        class={`absolute top-1 size-4 rounded-full bg-surface-container-high transition-transform duration-500 ease-in-out ${
          props.active ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </div>
  </button>
)

const RouteActions: VoidComponent<RouteActionsProps> = (props) => {
  const [routeResource] = createResource(() => props.routeName, getRoute)
  const [preservedRoutesResource] = createResource(
    () => props.routeName.split('|')[0],
    getPreservedRoutes,
  )

  const [isPublic, setIsPublic] = createSignal<boolean | undefined>(undefined)
  const [isPreserved, setIsPreserved] = createSignal<boolean | undefined>(undefined)

  createEffect(() => {
    const route = routeResource()
    const preservedRoutes = preservedRoutesResource()
    if (!route) return
    setIsPublic(route.is_public)
    if (route.is_preserved) {
      setIsPreserved(true)
    } else if (preservedRoutes) {
      setIsPreserved(preservedRoutes.some(r => r.fullname === route.fullname))
    } else {
      setIsPreserved(undefined)
    }
  })

  const [error, setError] = createSignal<string | null>(null)
  const [copied, setCopied] = createSignal(false)

  const toggleRoute = async (property: 'public' | 'preserved') => {
    setError(null)
    if (property === 'public') {
      const currentValue = isPublic()
      if (currentValue === undefined) return
      try {
        const newValue = !currentValue
        await setRoutePublic(props.routeName, newValue)
        setIsPublic(newValue)
      } catch (err) {
        console.error('Failed to update public toggle', err)
        setError('Failed to update toggle')
      }
    } else {
      const currentValue = isPreserved()
      if (currentValue === undefined) return
      
      try {
        const newValue = !currentValue
        await setRoutePreserved(props.routeName, newValue)
        setIsPreserved(newValue)
      } catch (err) {
        console.error('Failed to update preserved toggle', err)
        setError('Failed to update toggle')
      }
    }
  }

  const currentRouteId = () => props.routeName.replace('|', '/')

  const copyCurrentRouteId = async () => {
    if (!props.routeName || !navigator.clipboard) return

    try {
      await navigator.clipboard.writeText(currentRouteId())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy route ID: ', err)
    }
  }

  return (
    <div class="flex flex-col border-2 border-t-0 border-surface-container-high bg-surface-container-lowest p-5">
      <div class="font-mono text-body-md text-zinc-500">
        <h3 class="mb-2 ml-2">Route ID:</h3>
        <button
          onClick={() => void copyCurrentRouteId()}
          class="flex w-full cursor-pointer items-center justify-between rounded-lg border-2 border-surface-container-high bg-surface-container-lowest p-4 hover:bg-surface-container-low"
        >
          <div class="lg:text-body-lg">
            {currentRouteId().split('/')[0] || ''}/
            <br />
            {currentRouteId().split('/')[1] || ''}
          </div>
          <Icon size="24" class={`mr-5 ${copied() ? 'text-green-300' : ''}`}>{copied() ? 'check' : 'file_copy'}</Icon>
        </button>
      </div>

      <Show when={error()}>
        <div class="my-4 flex items-center rounded-md bg-red-900/30 p-4 text-red-500">
          <Icon class="mr-4 text-yellow-300">warning</Icon>
          <span class="font-mono">{error()}</span>
        </div>
      </Show>

      <div class="mt-4 divide-y-2 divide-surface-container-high overflow-hidden rounded-md border-2 border-surface-container-high">
        <ToggleButton
          label="Preserve Route"
          active={isPreserved()}
          onToggle={() => void toggleRoute('preserved')}
        />
        <ToggleButton
          label="Public Access"
          active={isPublic()}
          onToggle={() => void toggleRoute('public')}
        />
      </div>
    </div>
  )
}

export default RouteActions
