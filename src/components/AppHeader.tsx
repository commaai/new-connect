import { createContext, createSignal, useContext, type JSXElement, type ParentComponent, type Accessor, type Setter } from 'solid-js'
import TopAppBar from './material/TopAppBar'
import clsx from 'clsx'

interface HeaderState {
  title: string
  leading?: JSXElement
  trailing?: JSXElement
  variant?: 'main' | 'activity' | 'modal'
}

interface HeaderContext {
  state: Accessor<HeaderState>
  setState: Setter<HeaderState>
  updateState: (updates: Partial<HeaderState>) => void
}

const HeaderContext = createContext<HeaderContext>()

export function useHeader() {
  const context = useContext(HeaderContext)
  if (!context) throw new Error("can't find HeaderContext")
  return context
}

const AppHeader: ParentComponent = (props) => {
  const [state, setState] = createSignal<HeaderState>({
    title: 'connect',
    leading: <img src="/images/comma-white.svg" height="32" width="32" />,
    variant: 'main',
  })

  const updateState = (updates: Partial<HeaderState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }

  const headerClass = () => {
    const base = 'text-white p-4 bg-surface-container-highest border-b-2 border-b-outline-variant'

    switch (state().variant) {
      case 'main':
        return clsx(base, 'h-[4rem] fixed top-0 inset-x-0 left-0 right-0 z-20')
      case 'activity':
        return clsx(base, 'mx-4 mb-4 h-[28px]')
      case 'modal':
        return clsx(base, 'm-8')
      default:
        return base
    }
  }

  return (
    <HeaderContext.Provider value={{ state, setState, updateState }}>
      <TopAppBar component="h2" class={headerClass()} leading={state().leading} trailing={state().trailing}>
        {state().title}
      </TopAppBar>
      {props.children}
    </HeaderContext.Provider>
  )
}

export default AppHeader
