import type { ParentComponent } from 'solid-js'
import { A } from '@solidjs/router'
import clsx from 'clsx'

import Icon, { IconProps } from '~/components/material/Icon'

type NavigationBarItemProps = {
  icon: IconProps['name']
  href: string
  selected?: boolean
}

export const NavigationBarItem: ParentComponent<NavigationBarItemProps> = (props) => {
  // TODO: active indicator
  return (
    <A
      class="state-layer flex h-20 min-w-[48px] grow basis-0 flex-col items-center justify-center transition before:mx-auto before:mt-2.5 before:h-8 before:w-16 before:rounded-full"
      href={props.href}
      activeClass="text-on-surface before:bg-on-surface before:opacity-[.12]"
      inactiveClass="text-on-surface-variant before:bg-on-surface-variant"
    >
      <Icon class="flex transition-all" name={props.icon} filled={props.selected} />
      <div class="mt-2 flex text-label-lg">{props.children}</div>
    </A>
  )
}

type NavigationBarProps = {
  className?: string
}

const NavigationBar: ParentComponent<NavigationBarProps> = (props) => {
  return (
    <div class={clsx('pb-safe elevation-2 z-20 flex h-20 w-full flex-row gap-x-2 bg-surface text-on-surface', props.className)}>
      {props.children}
    </div>
  )
}

export default NavigationBar
