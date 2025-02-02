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
        class="hide-scrollbar fixed left-0 w-screen touch-pan-y overflow-y-auto overscroll-y-contain transition-all duration-300"
        style={{
          left: props.open ? 0 : `${-drawerWidth()}px`,
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
        class="absolute overflow-y-auto bg-background transition-all duration-300"
        style={{
          left: props.open ? `${drawerWidth()}px` : 0,
          width: getResponsiveWidth(),
          transform: isDesktop() ? 'none' : props.open ? `translateX(${drawerWidth()}px)` : 'translateX(0)',
          top: 'var(--top-header-height)',
          bottom: 0,
        }}
      >
        {props.children}
      </main>
    </>
  )
}

export default Drawer
