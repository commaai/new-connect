import { createSignal, type VoidComponent } from 'solid-js'
import clsx from 'clsx'
import Card from './material/Card'
import { useDrawerContext } from './material/Drawer'
import Icon from './material/Icon'

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
    <div
      class={clsx('fixed top-4 left-4 z-50', 'transition-transform duration-150 ease-out', isPressed() && 'scale-95', props.class)}
      onClick={handleClick}
    >
      <Card class={clsx('backdrop-blur-md bg-transparent border border-surface-container-high/30', 'shadow-lg shadow-black/5')}>
        <div class="flex items-center gap-3 px-3 py-2">
          {modal() ? (
            <Icon name="menu" size="24" class="bg-transparent hover:bg-surface-container-high/50" />
          ) : (
            <img src="/images/comma-white.svg" alt="menu" class="w-[24px] h-[24px] p-0.5" />
          )}
          <h1 class="text-title-lg font-medium text-on-surface">connect</h1>
        </div>
      </Card>
    </div>
  )
}

export default FloatingMenuButton
