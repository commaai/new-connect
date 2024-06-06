import type { ParentComponent } from 'solid-js'
import clsx from 'clsx'

type SurfaceProps = {
  class?: string
  variant?: boolean
}

const Surface: ParentComponent<SurfaceProps> = (props) => {
  return (
    <div
      class={clsx(
        props.variant
          ? 'bg-surface-variant text-on-surface-variant'
          : 'bg-surface text-on-surface',
        props.class,
      )}
    >
      {props.children}
    </div>
  )
}

export default Surface
