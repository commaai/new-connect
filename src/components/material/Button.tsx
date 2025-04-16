import type { JSXElement, ParentComponent } from 'solid-js'
import { Show, splitProps } from 'solid-js'
import clsx from 'clsx'

import ButtonBase, { ButtonBaseProps } from './ButtonBase'
import Icon from './Icon'

type ButtonProps = ButtonBaseProps & {
  color?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'text'
  disabled?: boolean
  loading?: boolean
  leading?: JSXElement
  trailing?: JSXElement
}

const Button: ParentComponent<ButtonProps> = (props) => {
  const color = () => props.color || 'primary'
  const colorClasses = () =>
    ({
      text: 'text-primary before:bg-on-primary',
      primary: 'bg-primary before:bg-on-primary text-on-primary hover:elevation-1',
      secondary: 'bg-secondary before:bg-on-secondary text-on-secondary hover:elevation-1',
      tertiary: 'bg-tertiary before:bg-on-tertiary text-on-tertiary hover:elevation-1',
      error: 'bg-error before:bg-on-error text-on-error hover:elevation-1',
    })[color()]
  const [, rest] = splitProps(props, ['color', 'leading', 'trailing', 'class', 'children', 'disabled', 'loading'])
  const disabled = () => props.disabled || props.loading

  return (
    <ButtonBase
      class={clsx(
        'state-layer inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full py-1 contrast-100 transition',
        colorClasses(),
        disabled() && 'cursor-not-allowed opacity-50',
        !disabled() && 'hover:opacity-80',
        props.leading ? 'pl-4' : 'pl-6',
        props.trailing ? 'pr-4' : 'pr-6',
        props.class,
      )}
      {...rest}
      disabled={disabled()}
    >
      {props.leading}
      <span class={clsx('text-label-lg', props.loading && 'invisible')}>{props.children}</span>
      <Show when={props.loading}>
        <Icon name="autorenew" class="absolute left-1/2 top-1/2 ml-[-10px] mt-[-10px] animate-spin" size="20" />
      </Show>
      {props.trailing}
    </ButtonBase>
  )
}

export default Button
