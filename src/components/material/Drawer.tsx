import { createContext, createSignal, useContext } from 'solid-js'
import type { Accessor, JSXElement, ParentComponent, Setter, VoidComponent } from 'solid-js'

import IconButton from '~/components/material/IconButton'
import { useDimensions } from '~/utils/window'

interface DrawerContext {
  open: Accessor<boolean>
  setOpen: Setter<boolean>
}

const DrawerContext = createContext<DrawerContext>()

export function useDrawerContext() {
  const context = useContext(DrawerContext)
  if (!context) throw new Error('can\'t find DrawerContext')
  return context
}

export const DrawerToggleButton: VoidComponent = () => {
  const { setOpen } = useDrawerContext()
  return <IconButton onClick={() => setOpen((prev) => !prev)}>menu</IconButton>
}

const PEEK = 56

interface DrawerProps {
  drawer: JSXElement
}

const Drawer: ParentComponent<DrawerProps> = (props) => {
  const dimensions = useDimensions()
  const drawerWidth = () => Math.min(dimensions().width - PEEK, 360)

  const [open, setOpen] = createSignal(false)

  return (
    <DrawerContext.Provider value={{ open, setOpen }}>
      <nav
        class="hide-scrollbar fixed inset-y-0 left-0 h-full touch-pan-y overflow-y-auto overscroll-y-contain transition-drawer duration-500"
        style={{
          left: open() ? 0 : `${-PEEK}px`,
          opacity: open() ? 1 : 0.5,
          width: `${drawerWidth()}px`,
        }}
      >
        <div class="flex size-full flex-col rounded-r-lg bg-surface-container-low text-on-surface-variant sm:rounded-r-none">
          {props.drawer}
        </div>
      </nav>

      <main
        class="absolute inset-y-0 w-screen overflow-y-auto bg-background transition-drawer duration-500"
        style={{
          left: open() ? `${drawerWidth()}px` : 0,
        }}
      >
        {props.children}
        <div
          class="absolute inset-0 bg-background transition-drawer duration-500"
          style={{
            'pointer-events': open() ? undefined : 'none',
            opacity: open() ? 0.5 : 0,
          }}
          onClick={() => setOpen(false)}
        />
      </main>
    </DrawerContext.Provider>
  )
}

export default Drawer
