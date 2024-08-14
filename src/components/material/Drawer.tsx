import type { JSXElement, ParentComponent } from 'solid-js'
import { useContext } from 'solid-js'
import { DashboardContext } from '~/pages/dashboard/Dashboard'
import { useDimensions } from '~/utils/window'

type DrawerProps = {
  drawer: JSXElement
  open: boolean
  onClose: () => void
}

const PEEK = 56

const Drawer: ParentComponent<DrawerProps> = (props) => {
  const { isDesktop } = useContext(DashboardContext)!
  const dimensions = useDimensions()
  
  const drawerWidth = () => isDesktop() ? 300 : dimensions().width - PEEK

  return (
    <>
      <nav
        class="hide-scrollbar fixed left-0 w-screen touch-pan-y overflow-y-auto overscroll-y-contain transition-drawer duration-500"
        style={{
          left: props.open ? 0 : `${-PEEK}px`,
          opacity: props.open ? 1 : 0.5,
          width: `${drawerWidth()}px`,
          top: 'var(--top-header-height)',
          bottom: 0,
        }}
      >
        <div class="flex h-full flex-col rounded-r-lg bg-surface-container-low text-on-surface-variant sm:rounded-r-none">
          {props.drawer}
        </div>
      </nav>
      <main
        class="absolute overflow-y-auto bg-background transition-drawer duration-500"
        style={{
          left: props.open ? `${drawerWidth()}px` : 0,
          right: 0,
          top: 'var(--top-header-height)',
          bottom: 0,
        }}
      >
        {props.children}
        {!isDesktop() && (
          <div
            class="absolute inset-0 bg-background transition-drawer duration-500"
            style={{
              'pointer-events': props.open ? undefined : 'none',
              opacity: props.open ? 0.5 : 0,
            }}
            onClick={props.onClose}
          />
        )}
      </main>
    </>
  )
}

export default Drawer
