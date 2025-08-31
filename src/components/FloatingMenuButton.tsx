import { createSignal, type VoidComponent } from 'solid-js'
import clsx from 'clsx'
import IconButton from './material/IconButton'
import Card from './material/Card'
import { useDrawerContext } from './material/Drawer'

type FloatingMenuButtonProps = {
  class?: string
}

const FloatingMenuButton: VoidComponent<FloatingMenuButtonProps> = (props) => {
  const { modal, open, setOpen } = useDrawerContext()
  const [isPressed, setIsPressed] = createSignal(false)

  const handleClick = () => {
    setOpen(!open())
    setIsPressed(true)
    setTimeout(() => setIsPressed(false), 150)
  }

  return (
    <div class={clsx('fixed top-4 left-4 z-50', 'transition-transform duration-150 ease-out', isPressed() && 'scale-95', props.class)}>
      <Card class={clsx('backdrop-blur-md bg-transparent border border-surface-container-high/30', 'shadow-lg shadow-black/5')}>
        <div class="flex items-center gap-3 px-3 py-2">
          {modal() ? (
            <IconButton name="menu" size="24" class="bg-transparent hover:bg-surface-container-high/50" onClick={handleClick} />
          ) : (
            <button
              class="w-[32px] h-[32px] min-w-[32px] min-h-[32px] state-layer inline-flex items-center justify-center rounded-full p-2 before:rounded-full before:bg-on-surface bg-transparent hover:bg-surface-container-high/50"
              onClick={handleClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 128 128" class="fill-current">
                <path
                  fill-rule="evenodd"
                  d="M35.806 128c0-2.96-.239-5.442.107-7.83.143-1.026 1.336-2.112 2.313-2.732 4.746-3.008 9.897-5.407 14.308-8.844 14.309-11.159 22.798-25.85 23.251-44.922.143-5.419-1.86-6.78-6.415-4.667-13.175 6.087-27.34 2.518-34.888-8.796-8.25-12.352-7.082-28.798 2.79-39.587C49.887-3.151 70.634-3.568 84.954 9.595c8.573 7.877 12.64 18.058 13.665 29.634 3.398 38.788-16.097 70.75-51.593 84.797-3.518 1.384-7.119 2.53-11.22 3.974"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          )}
          <h1 class="text-title-lg font-medium text-on-surface">connect</h1>
        </div>
      </Card>
    </div>
  )
}

export default FloatingMenuButton
