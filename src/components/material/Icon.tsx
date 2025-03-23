import { Component } from 'solid-js'
import clsx from 'clsx'

export type IconProps = {
  class?: string
  children: string
  filled?: boolean
  size?: '20' | '24' | '40' | '48'
}

/**
 * Use an icon from the Material Symbols library.
 *
 * Note: Icon names <strong>must</strong> be added to the icons list in vite.config.ts.
 *
 * @see https://fonts.google.com/icons
 */
const Icon: Component<IconProps> = (props) => {
  // size-20, 24 etc. defined in root.css
  const size = () => `size-${props.size || '24'}`
  return (
    <span
      class={clsx('material-symbols-outlined flex', props.filled ? 'icon-filled' : 'icon-outline', size(), props.class)}
    >
      {props.children}
    </span>
  )
}

export default Icon
