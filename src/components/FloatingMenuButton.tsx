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
            <img src="/images/comma-white.svg" alt="menu" class="w-[32px] h-[32px] p-1" />
          )}
          <h1 class="text-title-lg font-medium text-on-surface">connect</h1>
        </div>
      </Card>
    </div>
  )
}

export default FloatingMenuButton
