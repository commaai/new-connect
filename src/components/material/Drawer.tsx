import { createContext, createResource, createSignal, Show, Suspense, useContext } from 'solid-js'
import type { Accessor, JSXElement, ParentComponent, Setter } from 'solid-js'

import IconButton from '~/components/material/IconButton'
import { useDimensions } from '~/utils/window'
import Icon from './Icon'
import { getProfile } from '~/api/profile'

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

export const Header: ParentComponent<{ title?: string }> = (props) => {
  const { modal, setOpen } = useDrawerContext()
  return (
    <header class="fixed top-0 left-0 right-0 z-50 h-16">
      <div class="flex h-full items-center px-4">
        <div class="flex items-center gap-4">
          <Show when={modal()} fallback={<img alt="comma logo" src="/images/comma-white.svg" height="32" width="32" />}>
            <IconButton name="menu" onClick={() => setOpen((prev) => !prev)} />
          </Show>
          {props.title && <h1 class="text-xl font-medium">{props.title}</h1>}
        </div>
        <div class="ml-auto flex items-center gap-2">{props.children}</div>
      </div>
    </header>
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
  const [profile] = createResource(getProfile)

  return (
    <DrawerContext.Provider value={{ modal, open, setOpen }}>
      <Header title="connect">
        <Suspense fallback={<div class="min-h-16 rounded-md skeleton-loader" />}>
          <div class="shrink-0 size-10 inline-flex items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <Icon name={!profile.loading && !profile.latest ? 'person_off' : 'person'} filled />
          </div>
        </Suspense>
      </Header>
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
