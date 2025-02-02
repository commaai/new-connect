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
  const { isDesktop } = useContext(DashboardContext)!
  const dimensions = useDimensions()

  const drawerWidth = () => isDesktop() ? 300 : dimensions().width

  const getResponsiveWidth = () => {
    if (!isDesktop()) return '100%'
    return `calc(100% - ${props.open ? drawerWidth() : 0}px)`
  }

  return (
    <>
      <nav
        class="hide-scrollbar fixed bottom-0 left-0 top-[var(--top-header-height)] touch-pan-y overflow-y-auto overscroll-y-contain transition-drawer duration-300"
        style={{
          left: props.open ? 0 : `${-drawerWidth()}px`,
          width: `${drawerWidth()}px`,
        }}
      >
        <div class="flex h-full flex-col bg-surface-container-low text-on-surface-variant">
          {props.drawer}
        </div>
      </nav>
      <main
        class="absolute bottom-0 top-[var(--top-header-height)] overflow-y-auto bg-background transition-drawer duration-300"
        style={{
          left: props.open ? `${drawerWidth()}px` : 0,
          width: getResponsiveWidth(),
          transform: isDesktop() ? 'none' : props.open ? `translateX(${drawerWidth()}px)` : 'translateX(0)',
        }}
      >
        {props.children}
      </main>
    </>
  )
}

export default Drawer
