import type { JSXElement, JSX, Component, ParentComponent } from 'solid-js'

import { useDimensions, useScreen } from '~/utils/window'

type DrawerProps = {
  drawer: JSXElement
  open: boolean
  onOpen?: () => void
  onClose?: () => void
}

type OverlayProps = {
  open: boolean
  onClose?: () => void
}

const PEEK = 56

const Overlay: Component<OverlayProps> = (props) => {
  function handleOverlayClick(){
    if(props.onClose) props.onClose()
  }
  return (
    <div
      class="absolute inset-0 bg-background transition-drawer duration-500"
      style={{
        'pointer-events': props.open ? undefined : 'none',
        opacity: props.open ? 0.5 : 0,
      }}
      onClick={handleOverlayClick}
    />
  )
}


const Drawer: ParentComponent<DrawerProps> = (props) => {
  const screen = useScreen()
  const dimensions = useDimensions()
  const isMobile = () => screen().mobile()
  const drawerWidth = isMobile() ? dimensions().width - PEEK : 350
  const isOpen = () => !isMobile() || (isMobile() && props.open)

  function getContainerStyles (): JSX.CSSProperties {
    return {
      left: isOpen() ? `${drawerWidth}px` : 0,
      width: isMobile() ? '100%' : `${dimensions().width - drawerWidth}px`,
    }
  }

  function getNavbarStyles (): JSX.CSSProperties {
    const opened = isOpen()
    return {
      left: opened ? 0 : `${-PEEK}px`,
      opacity: opened ? 1 : 0.5,
      width: `${drawerWidth}px`,
    }
  }

  return (
    <div class="flex flex-row size-full relative overflow-hidden">
      <nav
        style={getNavbarStyles()}
        class="hide-scrollbar fixed inset-y-0 left-0 h-full touch-pan-y overflow-y-auto overscroll-y-contain transition-drawer duration-500">
        <div class="flex size-full flex-col rounded-r-lg bg-surface-container-low text-on-surface-variant sm:rounded-r-none">
          {props.drawer}
        </div>
      </nav>

      <main
        style={getContainerStyles()}
        class="flex-1 flex flex-col absolute inset-y-0 overflow-hidden bg-background transition-drawer duration-500 w-screen">
        {props.children}
        {isMobile() && isOpen() && (<Overlay open={isOpen()} onClose={props.onClose}/>)}
      </main>
    </div>
  )
}

export default Drawer
