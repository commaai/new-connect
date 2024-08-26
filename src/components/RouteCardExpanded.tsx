import { createSignal, Show, type VoidComponent } from 'solid-js'
import Button from '~/components/material/Button'
import Icon from '~/components/material/Icon'

interface RouteCardExpandedProps {
  routeId: string
}

const RouteCardExpanded: VoidComponent<RouteCardExpandedProps> = (props) => {
  const [preserveRoute, setPreserveRoute] = createSignal(false)
  const [makePublic, setMakePublic] = createSignal(false)
  const [copied, setCopied] = createSignal(false)

  const copyRouteId = () => {
    void navigator.clipboard.writeText(props.routeId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div class="flex flex-col border-x-2 border-[rgb(38,38,43)] bg-surface-container-lowest p-4">
      {/* Route ID */}
      <div class="mb-3 ml-2 text-body-sm text-zinc-500" style={{'font-family':"'JetBrains Mono', monospace"}}>Route ID: {props.routeId}</div>
      {/* Preserve Route */}

      {/* TODO: Create error function */}
      <Show when={false}> 
        <div class="mb-4 rounded-md bg-[rgb(150,51,51)] bg-opacity-[0.31] p-4 text-red-500">
          Error: {'This is a test error'}
        </div>
      </Show>
      
      <button
        class="flex w-full items-center justify-between rounded-t-md border-2 border-[rgb(38,38,43)] px-5 py-3 transition-colors hover:bg-surface-container-low"
        onClick={() => setPreserveRoute(!preserveRoute())}
      >
        <span class="text-body-lg">Preserve Route</span>

        {/* TODO: Toggle flashes white border UI bug */}
        {/* Toggle Button */}
        <div
          class={`relative h-9 w-16 rounded-full transition-colors ${
            preserveRoute() ? 'bg-green-300' : 'border-4 border-[rgb(38,38,43)]'
          }`}
        >
          <div
            class={`absolute top-1 size-5 rounded-full bg-[rgb(38,38,43)] transition-transform duration-500 ease-in-out ${
              preserveRoute() ? 'top-2 translate-x-9' : 'translate-x-1'
            }`}
          />
        </div>
      </button>
      {/* Make Public */}
      <button
        class="flex w-full items-center justify-between rounded-b-md border-2 border-t-0 border-[rgb(38,38,43)] px-5 py-3 transition-colors hover:bg-surface-container-low"
        onClick={() => setMakePublic(!makePublic())}
      >
        <span class="text-body-lg">Public Access</span>

        {/* TODO: Make toggle button into own component?? */}
        {/* Toggle Button */}
        <div
          class={`relative h-9 w-16 rounded-full transition-colors ${
            makePublic() ? 'bg-green-300' : 'border-4 border-[rgb(38,38,43)]'
          }`}
        >
          <div
            class={`absolute top-1 size-5 rounded-full bg-[rgb(38,38,43)] transition-transform duration-500 ease-in-out ${
              makePublic() ? 'top-2 translate-x-9' : 'translate-x-1'
            }`}
          />
        </div>
      </button>
      <div class="mt-4 flex gap-2">
        {/* Copy Route ID */}
        <Button
          // TODO: Make this into a component and wierd rendering of hover since it has previous compoonent styles
          class="w-full rounded-sm border-2 border-[rgb(38,38,43)] bg-surface-container-lowest py-6 text-on-surface-variant hover:bg-surface-container-low"
          onClick={copyRouteId}
          leading={
            <Icon 
              class={copied() ? 'text-green-300' : ''}
            >
              {copied() ? 'check' : 'file_copy'}
            </Icon>
          }
        >
          {copied() ? 'Copied!' : 'Route ID'}
        </Button>
        {/* Share */}
        <Button 
          class="w-full rounded-sm border-2 border-[rgb(38,38,43)] bg-surface-container-lowest py-6 text-on-surface-variant hover:bg-surface-container-low" 
          href="#" 
          leading={<Icon>share</Icon>}
        >
          Share
        </Button>
      </div>
    </div>
  )
}

export default RouteCardExpanded
