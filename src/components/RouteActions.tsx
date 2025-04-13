import { createSignal, Show, type VoidComponent, createEffect, createResource } from 'solid-js'
import clsx from 'clsx'

import { USERADMIN_URL } from '~/api/config'
import { setRoutePublic, setRoutePreserved, getPreservedRoutes, parseRouteName } from '~/api/route'
import Icon from '~/components/material/Icon'
import type { Route } from '~/api/types'

const ToggleButton: VoidComponent<{
  label: string
  active: boolean | undefined
  onToggle: () => void
}> = (props) => (
  <button
    class="flex w-full items-center justify-between p-2 transition-colors hover:bg-surface-container-low rounded-md"
    onClick={() => props.onToggle()}
  >
    <span class="text-sm text-on-surface-variant">{props.label}</span>

    {/* Toggle Switch */}
    <div
      class={`relative h-6 w-10 rounded-full border-2 transition-colors ${
        props.active ? 'border-green-300 bg-green-300' : 'border-surface-container-highest'
      }`}
    >
      <div
        class={`absolute top-1 size-3 rounded-full bg-surface-container-highest transition-transform duration-300 ease-in-out ${
          props.active ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </div>
  </button>
)

interface RouteActionsProps {
  routeName: string
  route: Route | undefined
}

const RouteActions: VoidComponent<RouteActionsProps> = (props) => {
  const [preservedRoutesResource] = createResource(() => parseRouteName(props.routeName).dongleId, getPreservedRoutes)

  const [isPublic, setIsPublic] = createSignal<boolean | undefined>(undefined)
  const [isPreserved, setIsPreserved] = createSignal<boolean | undefined>(undefined)

  const useradminUrl = () => `${USERADMIN_URL}/?onebox=${currentRouteId()}`

  createEffect(() => {
    const preservedRoutes = preservedRoutesResource()
    if (!props.route) return
    setIsPublic(props.route.is_public)
    if (preservedRoutes) {
      const { fullname } = props.route
      setIsPreserved(preservedRoutes.some((r) => r.fullname === fullname))
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
    <div class="flex flex-col rounded-b-md gap-4 mx-5 mb-4">
      <div class="font-mono text-xs text-zinc-500">
        <div class="flex justify-between">
          <span class="mb-2 text-on-surface-variant">Route ID:</span>
          <a href={useradminUrl()} class="text-blue-400 hover:text-blue-500 duration-200" target="_blank" rel="noopener noreferrer">
            View in useradmin
          </a>
        </div>
        <button
          onClick={() => void copyCurrentRouteId()}
          class="flex w-full cursor-pointer items-center justify-between rounded-lg border-2 border-surface-container-high bg-surface-container-lowest p-3 hover:bg-surface-container-low"
        >
          <div class="lg:text-sm">
            <span class="break-keep inline-block">{currentRouteId().split('/')[0] || ''}/</span>
            <span class="break-keep inline-block">{currentRouteId().split('/')[1] || ''}</span>
          </div>
          <Icon class={clsx('mx-2', copied() && 'text-green-300')} name={copied() ? 'check' : 'file_copy'} size="20" />
        </button>
      </div>

      <div class="flex flex-col gap-2">
        <ToggleButton label="Preserve Route" active={isPreserved()} onToggle={() => void toggleRoute('preserved')} />
        <ToggleButton label="Public Access" active={isPublic()} onToggle={() => void toggleRoute('public')} />
      </div>

      <Show when={error()}>
        <div class="flex gap-2 rounded-sm bg-surface-container-high p-2 text-sm text-on-surface">
          <Icon class="text-error" name="error" size="20" />
          {error()}
        </div>
      </Show>
    </div>
  )
}

export default RouteActions
