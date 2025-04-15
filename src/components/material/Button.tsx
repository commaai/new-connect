import type { JSXElement, ParentComponent } from 'solid-js'
import { Show, splitProps } from 'solid-js'
import clsx from 'clsx'

import ButtonBase, { type ButtonBaseProps } from './ButtonBase'
import Icon from './Icon'

type ButtonVariant = 'filled' | 'tonal' | 'text'
type ButtonState = 'enabled' | 'disabled'

const ButtonStyles: Record<ButtonVariant, Record<ButtonState, string>> = {
  filled: {
    enabled:
      'bg-primary before:bg-on-primary text-on-primary hover:elevation-1 focus-visible:outline-secondary sm:before:hover:opacity-[.16]',
    disabled: 'bg-on-surface/[.12] text-on-surface/[.38]',
  },
  tonal: {
    enabled:
      'bg-secondary-container before:bg-on-secondary-container text-on-secondary-container hover:elevation-1 focus-visible:outline-secondary',
    disabled: 'bg-on-surface/[.12] text-on-surface/[.38]',
  },
  text: {
    enabled: 'text-primary before:bg-primary focus:outline-secondary',
    disabled: 'text-on-surface/[.38]',
  },
} as const

type ButtonProps = ButtonBaseProps & {
  variant?: keyof typeof ButtonStyles
  disabled?: boolean
  loading?: boolean
  leading?: JSXElement
  trailing?: JSXElement
}

const Button: ParentComponent<ButtonProps> = (props) => {
  const variant = () => props.variant || 'filled'
  const style = () => ButtonStyles[variant()]
  const [, rest] = splitProps(props, ['variant', 'leading', 'trailing', 'class', 'children', 'disabled', 'loading'])
  const disabled = () => props.disabled || props.loading

  return (
    <ButtonBase
      class={clsx(
        'state-layer inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full py-1 transition',
        'focus:outline-none focus-visible:outline focus:outline-[3px] focus:outline-offset-[2px]',
        style().enabled,
        disabled() && [style().disabled, 'cursor-not-allowed !elevation-0 before:!opacity-0'],
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
