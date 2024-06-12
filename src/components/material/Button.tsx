import type { JSXElement, ParentComponent } from 'solid-js'
import { splitProps } from 'solid-js'
import clsx from 'clsx'

import ButtonBase, { ButtonBaseProps } from './ButtonBase'
import Typography from './Typography'

type ButtonProps = ButtonBaseProps & {
  color?: 'primary' | 'secondary' | 'tertiary' | 'error'
  disabled?: boolean
  leading?: JSXElement
  trailing?: JSXElement
}

const Button: ParentComponent<ButtonProps> = (props) => {
  const color = () => props.color || 'primary'
  const colorClasses = () =>
    ({
      primary: 'bg-primary before:bg-on-primary text-on-primary',
      secondary: 'bg-secondary before:bg-on-secondary text-on-secondary',
      tertiary: 'bg-tertiary before:bg-on-tertiary text-on-tertiary',
      error: 'bg-error before:bg-on-error text-on-error',
    })[color()]
  const [, rest] = splitProps(props, [
    'color',
    'leading',
    'trailing',
    'class',
    'children',
  ])

  return (
    <ButtonBase
      class={clsx(
        'state-layer hover:elevation-1 inline-flex h-10 items-center justify-center gap-2 rounded-full py-1 contrast-100 transition',
        colorClasses(),
        props.disabled && 'cursor-not-allowed opacity-50',
        props.leading ? 'pl-4' : 'pl-6',
        props.trailing ? 'pr-4' : 'pr-6',
        props.class,
      )}
      {...rest}
    >
      {props.leading}
      <Typography variant="label-lg">{props.children}</Typography>
      {props.trailing}
    </ButtonBase>
  )
}

export default Button
