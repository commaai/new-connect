import { createContext, createSignal, Show, useContext } from 'solid-js'
import type { Accessor, JSXElement, ParentComponent, Setter, VoidComponent } from 'solid-js'

import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'
import { useDimensions } from '~/utils/window'
import { USERADMIN_URL } from '~/api/config'
import { useNavigate } from '@solidjs/router'

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

const PEEK = 56

const AppHeader: VoidComponent = () => {
  const navigate = useNavigate()
  const { modal, open, setOpen } = useDrawerContext()
  const navHome = () => navigate('/')

  return (
    <TopAppBar
      class="fixed top-0 left-0 right-0 h-16 p-4"
      leading={
        <Show
          when={modal()}
          fallback={<img onClick={navHome} class="cursor-pointer" alt="comma logo" src="/images/comma-white.svg" height="32" width="32" />}
        >
          <IconButton name={open() ? 'close' : 'menu'} onClick={() => setOpen((prev) => !prev)} />
        </Show>
      }
      trailing={
        <div class="flex items-center gap-2">
          <IconButton href={USERADMIN_URL} name="person" filled target="_blank" />
          <IconButton href="/logout" name="logout" />
        </div>
      }
    >
      <span class="cursor-pointer font-bold" onClick={navHome}>
        connect
      </span>
    </TopAppBar>
  )
}

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
      <AppHeader />
      <nav
        class="hide-scrollbar fixed inset-y-0 left-0 h-full touch-pan-y overflow-y-auto overscroll-y-contain transition-drawer duration-500"
        style={{
          left: drawerVisible() ? 0 : `${-PEEK}px`,
          opacity: drawerVisible() ? 1 : 0.5,
          width: `${drawerWidth()}px`,
          top: '4rem',
          height: 'calc(100vh - 4rem)',
        }}
      >
        <div class="flex size-full flex-col rounded-r-lg text-on-surface-variant sm:rounded-r-none">{props.drawer}</div>
      </nav>

      <main
        class="absolute inset-y-0 overflow-y-auto bg-background transition-drawer duration-500"
        style={{
          left: drawerVisible() ? `${drawerWidth()}px` : 0,
          width: contentWidth(),
          top: '4rem',
          height: 'calc(100vh - 4rem)',
        }}
      >
        {props.children}
        <div
          class="absolute inset-0 z-[9999] bg-background transition-drawer duration-500"
          style={{
            'pointer-events': modal() && open() ? 'auto' : 'none',
            opacity: modal() && open() ? 0.5 : 0,
          }}
          onClick={() => setOpen(false)}
        />
      </main>
    </DrawerContext.Provider>
  )
}

export default Drawer
