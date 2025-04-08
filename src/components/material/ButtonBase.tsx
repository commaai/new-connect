import { Show, splitProps } from 'solid-js'
import type { Component, JSX } from 'solid-js'
import { A } from '@solidjs/router'
import clsx from 'clsx'

export type ButtonBaseProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  class?: string
  onClick?: (e: MouseEvent) => void
  href?: string
  external?: boolean
  activeClass?: string
}

const ButtonBase: Component<ButtonBaseProps> = (props) => {
  const onClick: JSX.EventHandler<unknown, MouseEvent> = (e: MouseEvent) => {
    props.onClick?.(e)
  }

  const classNames = () => clsx('relative isolate overflow-hidden', props.class)
  const [, rest] = splitProps(props, ['class', 'external', 'onClick', 'href'])
  return (
    <Show
      when={props.href}
      fallback={
        <button class={classNames()} onClick={onClick} {...rest}>
          {props.children}
        </button>
      }
      keyed
    >
      {(href) => (
        <A
          class={classNames()}
          onClick={onClick}
          href={href}
          activeClass={props.activeClass}
          target={props.external ? '_blank' : undefined}
        >
          {props.children}
        </A>
      )}
    </Show>
  )
}

export default ButtonBase
