import { onCleanup } from 'solid-js'
import type { JSX, VoidComponent } from 'solid-js'

export type RippleEffect = {
  id: number
  style: RippleStyle
  timestamp: number
}

type RippleStyle = Pick<
  JSX.CSSProperties,
  'height' | 'width' | 'left' | 'top' | 'z-index'
>

type RippleProps = {
  id: number
  class: string
  style: RippleStyle
  terminate: (id: number) => void
}

const Ripple: VoidComponent<RippleProps> = (props) => {
  const timer = setTimeout(() => props.terminate(props.id), 550)
  onCleanup(() => clearTimeout(timer))

  return <span class={props.class} style={props.style} />
}

export default Ripple
