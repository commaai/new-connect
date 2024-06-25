import { onCleanup, createSignal, ParentComponent, JSX } from 'solid-js'
import clsx from 'clsx'
import { Dynamic } from 'solid-js/web'

interface TopAppBarProps {
  leading?: JSX.Element;
  as?: string;
  trailing?: JSX.Element;
  component?: string;
}

const TopAppBar: ParentComponent<TopAppBarProps & { className?: string; }> = (props) => {
  const [isLargeScreen, setIsLargeScreen] = createSignal(false)

  let mql: MediaQueryList
  if (typeof window !== 'undefined' && typeof window.matchMedia !== 'undefined') {
    mql = window.matchMedia('(min-width: 1024px)')
    setIsLargeScreen(mql.matches)
    mql.addEventListener('change', (e) => setIsLargeScreen(e.matches))

    onCleanup(() => mql.removeEventListener('change', (e) => setIsLargeScreen(e.matches)))
  }

  return (
    <div
      class={clsx(
        'inset-x-0 top-0 flex h-16 items-center gap-4 px-4 py-5 text-on-surface',
        props.className,
      )}
    >
      {!isLargeScreen() && props.leading}
      <Dynamic class="flex grow items-center justify-between text-title-lg" component={props.component || 'h2'}>
        {props.children}
        {isLargeScreen() && <a href="/logout"><span class="material-symbols-outlined icon-outline m-4 cursor-pointer rounded-full p-1.5 text-black hover:opacity-85" style={{ background: '#bbc4fd'}}>logout</span></a>}
      </Dynamic>
      {props.trailing}
    </div>
  )
}

export default TopAppBar
