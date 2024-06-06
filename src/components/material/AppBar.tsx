import type { ParentComponent } from 'solid-js'
import clsx from 'clsx'

type AppBarProps = {
  class?: string
  relative?: boolean
}

const AppBar: ParentComponent<AppBarProps> = (props) => {
  const position = () => (props.relative ? 'relative' : 'absolute')
  return (
    <div
      class={clsx(
        'inset-x-0 top-0 flex h-20 items-center bg-surface-variant px-8 text-on-surface-variant',
        position(),
        props.class,
      )}
    >
      {props.children}
    </div>
  )
}

export default AppBar
