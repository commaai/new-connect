import clsx from 'clsx'
import { createContext, createSignal, Show, useContext } from 'solid-js'
import type { Accessor, JSXElement, ParentComponent, Setter, VoidComponent } from 'solid-js'

import IconButton from '~/components/material/IconButton'
import { useDimensions } from '~/utils/window'

interface DrawerContext {
  modal: Accessor<boolean>
  open: Accessor<boolean>
  setOpen: Setter<boolean>
}

const DrawerContext = createContext<DrawerContext>()

export function useDrawerContext() {
  const context = useContext(DrawerContext)
  if (!context) throw new Error("can't find DrawerContext")
  return context
}

export const DrawerToggleButton: VoidComponent = () => {
  const { modal, setOpen } = useDrawerContext()
  return (
    <Show when={modal()}>
      <IconButton name="menu" onClick={() => setOpen((prev) => !prev)} />
    </Show>
  )
}

const PEEK = 56

interface DrawerProps {
  drawer: JSXElement
}

const Drawer: ParentComponent<DrawerProps> = (props) => {
  const dimensions = useDimensions()
  const drawerWidth = () => Math.min(dimensions().width - PEEK, 320)
  const modal = () => dimensions().width < 1280
  const contentWidth = () => `calc(100% - ${modal() ? 0 : drawerWidth()}px)`

  const [open, setOpen] = createSignal(false)
  const drawerVisible = () => !modal() || open()

  return (
    <DrawerContext.Provider value={{ modal, open, setOpen }}>
      <nav
        class={clsx(
          'hide-scrollbar inset-y-0 left-0 h-full touch-pan-y overflow-y-auto overscroll-y-contain transition-drawer ease-in-out duration-300',
          modal() && open() ? 'absolute z-[9999]' : 'fixed top-[4rem] h-[calc(100vh-4rem)]',
        )}
        style={{
          left: drawerVisible() ? 0 : `${-drawerWidth()}px`,
          width: `${drawerWidth()}px`,
        }}
      >
        <div class="flex size-full flex-col rounded-r-lg bg-surface-container border text-on-surface-variant sm:rounded-r-none">
          {props.drawer}
        </div>
      </nav>

      <main
        class="absolute inset-y-0 z-0 overflow-y-auto bg-background transition-drawer ease-in-out duration-300"
        style={{
          left: !modal() ? `${drawerWidth()}px` : 0,
          width: contentWidth(),
        }}
      >
        {props.children}
        <div
          class="absolute inset-0 z-[9999] bg-background transition-drawer ease-in-out duration-300"
          style={{
            'pointer-events': modal() && open() ? 'auto' : 'none',
            opacity: modal() && open() ? 0.75 : 0,
          }}
          onClick={() => setOpen(false)}
        />
      </main>
    </DrawerContext.Provider>
  )
}

export default Drawer
