import type { JSXElement, ParentComponent } from 'solid-js'

import { useDimensions } from '~/utils/window'

type DrawerProps = {
  drawer: JSXElement
  open: boolean
  onOpen?: () => void
  onClose?: () => void
}

const PEEK = 56

const Drawer: ParentComponent<DrawerProps> = (props) => {
  const dimensions = useDimensions()

  const isMobile = dimensions().width < 500
  const drawerWidth = isMobile ? dimensions().width - PEEK : 350

  const onClose = () => props.onClose?.()

  return (
    <>
      <nav
        class="hide-scrollbar fixed inset-y-0 left-0 h-full w-screen touch-pan-y overflow-y-auto overscroll-y-contain transition-drawer duration-500"
        style={{
          left: props.open ? 0 : `${-PEEK}px`,
          opacity: props.open ? 1 : 0.5,
          width: `${drawerWidth}px`,
        }}
      >
        <div class="flex size-full flex-col rounded-r-lg bg-surface-container-low text-on-surface-variant sm:rounded-r-none">
          {props.drawer}
        </div>
      </nav>

      <main
        class="absolute inset-y-0 w-screen overflow-y-auto bg-background transition-drawer duration-500"
        style={{ left: props.open ? `${drawerWidth}px` : 0 }}
      >
        {props.children}
        <div
          class="absolute inset-0 bg-background transition-drawer duration-500"
          style={{
            'pointer-events': props.open ? undefined : 'none',
            opacity: props.open ? 0.5 : 0,
          }}
          onClick={onClose}
        />
      </main>
    </>
  )
}

export default Drawer
