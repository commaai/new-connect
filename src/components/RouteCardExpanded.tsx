import { createSignal, Show, type VoidComponent } from 'solid-js'
import Button from '~/components/material/Button'
import Icon from '~/components/material/Icon'
import { setRoutePublic, setRoutePreserved } from '~/api/route'
import { USERADMIN_URL } from '~/api/config'

interface RouteCardExpandedProps {
  routeName: string
  initialPublic: boolean
  initialPreserved: boolean
}

function createToggle<T>(initialValue: boolean, apiCall: (routeName: string, value: boolean) => Promise<T>) {
  const [value, setValue] = createSignal(initialValue)

  const toggle = (routeName: string) => {
    const newValue = !value()
    apiCall(routeName, newValue)
      .then(() => setValue(newValue))
      .catch((err) => {
        console.error(err)
        throw new Error('Failed to update toggle')
      })
  }

  return [value, toggle] as const
}

const ToggleButton: VoidComponent<{
  label: string
  active: () => boolean
  onToggle: () => void
}> = (props) => (
  <button
    class="flex w-full items-center justify-between px-5 py-3 transition-colors hover:bg-surface-container-low"
    onClick={() => props.onToggle()}
  >
    <span class="text-body-lg">{props.label}</span>
    
    {/* Toggle Switch */}
    <div
      class={`relative h-9 w-16 rounded-full border-4 transition-colors ${
        props.active() ? 'border-green-300 bg-green-300' : 'border-surface-container-high'
      }`}
    >
      <div
        class={`absolute top-1 size-5 rounded-full bg-surface-container-high transition-transform duration-500 ease-in-out ${
          props.active() ? 'top-1 translate-x-8' : 'translate-x-1'
        }`}
      />
    </div>
  </button>
)

const ActionButton: VoidComponent<{
  onClick: () => void
  icon: string
  activeIcon?: string
  label: string
  activeLabel?: string
  isActive?: () => boolean
}> = (props) => {
  const isActive = () => props.isActive?.() || false

  return (
    <Button
      class="w-full rounded-sm border-2 border-surface-container-high bg-surface-container-lowest py-8 text-on-surface-variant hover:bg-surface-container-low"
      onClick={props.onClick}
      leading={
        <Icon size="34" class={isActive() ? 'text-green-300' : ''}>
          {isActive() ? props.activeIcon || props.icon : props.icon}
        </Icon>
      }
      noPadding
    >
      <span class="whitespace-pre-line">
        {isActive() ? props.activeLabel || props.label : props.label}
      </span>
    </Button>
  )
}

const RouteCardExpanded: VoidComponent<RouteCardExpandedProps> = (props) => {
  const [preserveRoute, togglePreserveRoute] = createToggle(props.initialPreserved, setRoutePreserved)
  const [makePublic, toggleMakePublic] = createToggle(props.initialPublic, setRoutePublic)
  const [error, setError] = createSignal<string | null>(null)
  const [copied, setCopied] = createSignal(false)

  const handleToggle = (toggleFn: (routeName: string) => void) => {
    setError(null)
    try {
      toggleFn(props.routeName)
    } catch (err) {
      setError((err as Error).message)
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

  const openInUseradmin = () => {
    const url = `${USERADMIN_URL}?${new URLSearchParams({ onebox: props.routeName }).toString()}`
    window.open(url, '_blank')?.focus()
  }

  return (
    <div class="flex flex-col border-x-2 border-surface-container-high bg-surface-container-lowest p-4">
      <div 
        class="mb-4 ml-2 text-body-sm text-zinc-500" 
        style={{'font-family':"'JetBrains Mono', monospace"}}
      >
        <div>Route ID:</div>
        <div class="mt-1 break-all md:text-body-md">{currentRouteId()}</div>
      </div>

      <Show when={error()}>
        <div class="mb-4 flex items-center rounded-md bg-red-900/30 p-4 text-red-500">
          <Icon class="mr-4 text-yellow-300">warning</Icon>
          <span style={{'font-family': "'JetBrains Mono', monospace"}}>{error()}</span>
        </div>
      </Show>
      
      <div class="flex flex-col overflow-hidden rounded-md border-2 border-surface-container-high">
        <ToggleButton
          label="Preserve Route"
          active={preserveRoute}
          onToggle={() => handleToggle(togglePreserveRoute)}
        />
        {/* Horizontal Divider */}
        <div class="h-[2px] bg-surface-container-high" />
        <ToggleButton
          label="Public Access"
          active={makePublic}
          onToggle={() => handleToggle(toggleMakePublic)}
        />
      </div>

      <div class="mt-4 flex gap-[.75rem]">
        <ActionButton
          onClick={() => void copyCurrentRouteId()}
          icon="file_copy"
          activeIcon="check"
          label="Route ID"
          activeLabel="Copied!"
          isActive={copied}
        />
        <ActionButton
          onClick={openInUseradmin}
          icon="open_in_new"
          label={'View in\nuseradmin'}
        />
      </div>
    </div>
  )
}

export default RouteCardExpanded
