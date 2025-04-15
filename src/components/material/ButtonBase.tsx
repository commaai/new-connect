import { splitProps, type Component, type JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { A, type AnchorProps } from '@solidjs/router'
import clsx from 'clsx'

export type ButtonBaseProps = { class?: string } & (AnchorProps | JSX.ButtonHTMLAttributes<HTMLButtonElement>)

const ButtonBase: Component<ButtonBaseProps> = (props) => {
  const [, rest] = splitProps(props, ['class'])
  return (
    <Dynamic
      component={'href' in props ? A : 'button'}
      class={clsx('relative isolate overflow-hidden', props.class)}
      {...rest}
      data-disabled={'disabled' in props && props.disabled}
    />
  )
}

export default ButtonBase
