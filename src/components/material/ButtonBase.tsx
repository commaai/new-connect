import { Show, splitProps } from 'solid-js'
import type { Component, JSX } from 'solid-js'
import { A } from '@solidjs/router'
import clsx from 'clsx'

export type ButtonBaseProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  class?: string
  onClick?: (e: MouseEvent) => void
  href?: string
  activeClass?: string
}

const ButtonBase: Component<ButtonBaseProps> = (props) => {
  const onClick: JSX.EventHandler<unknown, MouseEvent> = (e: MouseEvent) => {
    props.onClick?.(e)
  }

  const [, rest] = splitProps(props, ['class', 'onClick', 'href'])
  return (
    <Show
      when={props.href}
      fallback={
        <button class={clsx('relative isolate overflow-hidden', props.class)} onClick={onClick} {...rest}>
          {props.children}
        </button>
      }
      keyed
    >
      {(href) => (
        <A
          class={clsx('relative isolate overflow-hidden', props.class)}
          onClick={onClick}
          href={href}
          activeClass={props.activeClass}
        >
          {props.children}
        </A>
      )}
    </Show>
  )
}

export default ButtonBase
