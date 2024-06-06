/* eslint-disable tailwindcss/no-custom-classname */
import { Component } from 'solid-js'
import clsx from 'clsx'

export type IconProps = {
  class?: string
  children: string
  filled?: boolean
  size?: '20' | '24' | '40' | '48'
}

const Icon: Component<IconProps> = (props) => {
  // size-20, 24 etc. defined in root.css
  return (
    <span
      class={clsx(
        'material-symbols-outlined flex',
        props.filled ? 'icon-filled' : 'icon-outline',
        `size-${props.size || '24'}`,
        props.class,
      )}
    >
      {props.children}
    </span>
  )
}

export default Icon
