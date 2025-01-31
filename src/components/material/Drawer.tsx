import type { JSXElement, ParentComponent } from 'solid-js'
import { useContext } from 'solid-js'
import { DashboardContext } from '~/pages/dashboard/Dashboard'
import { useDimensions } from '~/utils/window'

type DrawerProps = {
  drawer: JSXElement
  open: boolean
  onClose: () => void
}

const Drawer: ParentComponent<DrawerProps> = (props) => {
  const { isDesktop, showHeader } = useContext(DashboardContext)!
  const dimensions = useDimensions()

  const drawerWidth = () => isDesktop() ? 300 : dimensions().width

  return (
    <>
      <nav
        class="hide-scrollbar fixed left-0 w-screen touch-pan-y overflow-y-auto overscroll-y-contain transition-drawer duration-500"
        style={{
          left: props.open ? 0 : `${-drawerWidth()}px`,
          opacity: props.open ? 1 : 0.5,
          width: `${drawerWidth()}px`,
          top: 'var(--top-header-height)',
          bottom: 0,
        }}
      >
        <div class="flex h-full flex-col bg-surface-container-low text-on-surface-variant">
          {props.drawer}
        </div>
      </nav>
      <main
        class="absolute overflow-y-auto bg-background transition-drawer duration-500"
        style={{
          left: props.open ? `${drawerWidth()}px` : 0,
          right: 0,
          top: showHeader() ? 'var(--top-header-height)' : 0,
          bottom: 0,
        }}
      >
        {props.children}
      </main>
    </>
  )
}

export default Drawer
