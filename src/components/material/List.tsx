import type { JSXElement, ParentComponent, VoidComponent } from 'solid-js'
import clsx from 'clsx'

import ButtonBase from '~/components/material/ButtonBase'
import Icon from './Icon'

type CarWithStatusIndicatorProps = {
  isOnline: boolean
  iconName: string
}

export const IconWithStatusIndicator: VoidComponent<CarWithStatusIndicatorProps> = (props) => {
  return (
    <div class="flex items-center">
      <span
        class={clsx(
          'ml-2 mr-4 size-2 rounded-full',
          props.isOnline ? 'bg-green-400' : 'bg-gray-400',
        )}
      />
      <Icon>{props.iconName}</Icon>
    </div>
  )
}

type ListItemContentProps = {
  headline: JSXElement
  subhead?: JSXElement
}

export const ListItemContent: VoidComponent<ListItemContentProps> = (props) => {
  return (
    <div>
      <div class="text-body-lg text-on-surface">{props.headline}</div>
      {props.subhead && <div class="text-body-md text-on-surface-variant">{props.subhead}</div>}
    </div>
  )
}

type ListItemProps = {
  class?: string
  variant?: '1-line' | '2-line' | '3-line' | 'nav'
  selected?: boolean
  leading?: JSXElement
  trailing?: JSXElement
  onClick?: () => void
  href?: string
}

// TODO: guess variant from content
export const ListItem: ParentComponent<ListItemProps> = (props) => {
  const variant = () => props.variant || '1-line'
  const variantStyle = () =>
    ({
      '1-line': 'h-14',
      '2-line': 'h-20',
      '3-line': 'h-28',
      nav: 'h-14 before:rounded-full before:duration-0',
    }[variant()])
  return (
    <ButtonBase
      class={clsx(
        'elevation-0 state-layer flex items-center gap-4 py-2 pl-4 pr-6 transition-colors before:bg-on-surface',
        variantStyle(),
        props.selected && 'before:opacity-[.12]',
        props.class,
      )}
      onClick={props.onClick}
      href={props.href}
    >
      {props.leading}
      {props.children}
      {props.trailing && <span class="ml-auto">{props.trailing}</span>}
    </ButtonBase>
  )
}

type ListProps = {
  class?: string
  variant?: 'nav'
}

const List: ParentComponent<ListProps> = (props) => {
  return (
    <div
      class={clsx(
        'flex flex-col',
        props.variant === 'nav' ? 'gap-0' : 'gap-2',
        props.class,
      )}
    >
      {props.children}
    </div>
  )
}

export default List
