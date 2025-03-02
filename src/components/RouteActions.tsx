import { createSignal, Show, type VoidComponent, createEffect, createResource } from 'solid-js'
import clsx from 'clsx'

import { setRoutePublic, setRoutePreserved, getRoute, getPreservedRoutes } from '~/api/route'
import Icon from '~/components/material/Icon'

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
    <span class="text-body-sm text-on-surface-variant">{props.label}</span>

    {/* Toggle Switch */}
    <div
      class={`relative h-4 w-8 rounded-full border-2 transition-colors ${
        props.active ? 'border-green-300 bg-green-300' : 'border-surface-container-high'
      }`}
    >
      <div
        class={`absolute size-3 rounded-full bg-surface-container-high transition-transform duration-500 ease-in-out ${
          props.active ? 'translate-x-4' : 'translate-x-0'
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
    <div class="flex flex-col bg-surface-container-low ">
      <div class="font-mono px-5 text-body-sm text-zinc-500">
        <h3 class="mb-2 text-on-surface-variant">Route ID:</h3>
        <button
          onClick={() => void copyCurrentRouteId()}
          class="flex w-full cursor-pointer items-center justify-between rounded-lg border-2 border-surface-container-high bg-surface-container-lowest p-3 hover:bg-surface-container-low"
        >
          <div class="lg:text-body-sm">
            <span class="break-keep inline-block">
              {currentRouteId().split('/')[0] || ''}/
            </span>
            <span class="break-keep inline-block">
              {currentRouteId().split('/')[1] || ''}
            </span>
          </div>
          <Icon size="20" class={clsx('px-2', copied() && 'text-green-300')}>{copied() ? 'check' : 'file_copy'}</Icon>
        </button>
      </div>

      <Show when={error()}>
        <div class="m-4 p-2 flex items-center justify-center rounded-md bg-red-900/30 text-red-500">
          <Icon size='20' class="mr-4 text-yellow-300">warning</Icon>
          <span class="font-mono text-body-sm">{error()}</span>
        </div>
      </Show>

      <div class={clsx('overflow-hidden rounded-md', !error() && 'pt-4')}>
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
