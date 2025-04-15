import { splitProps, type Component, type JSX } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { A, type AnchorProps } from '@solidjs/router'

import { cn } from '~/utils/style'

export type ButtonBaseProps = { class?: string } & (AnchorProps | JSX.ButtonHTMLAttributes<HTMLButtonElement>)

const ButtonBase: Component<ButtonBaseProps> = (props) => {
  const [, rest] = splitProps(props, ['class'])
  return <Dynamic component={'href' in props ? A : 'button'} class={cn('relative isolate overflow-hidden', props.class)} {...rest} />
}

export default ButtonBase
