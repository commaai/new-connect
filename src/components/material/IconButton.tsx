import type { Component } from 'solid-js'
import { splitProps } from 'solid-js'
import clsx from 'clsx'

import ButtonBase, { ButtonBaseProps } from './ButtonBase'
import Icon, { IconProps } from '~/components/material/Icon'

type IconButtonProps = ButtonBaseProps & {
  children: string
  filled?: IconProps['filled']
  size?: IconProps['size']
}

const IconButton: Component<IconButtonProps> = (props) => {
  const size = () => props.size || '24'
  const buttonSize = () =>
    ({
      '20': 'min-w-[28px] min-h-[28px]',
      '24': 'min-w-[32px] min-h-[32px]',
      '40': 'min-w-[48px] min-h-[48px]',
      '48': 'min-w-[56px] min-h-[56px]',
    }[size()])
  const [, rest] = splitProps(props, ['class', 'children', 'filled', 'size'])
  return (
    <ButtonBase
      class={clsx(
        'state-layer inline-flex items-center justify-center rounded-full p-2 before:rounded-full before:bg-on-surface',
        buttonSize,
        props.class,
      )}
      {...rest}
    >
      <Icon filled={props.filled} size={size()}>
        {props.children}
      </Icon>
    </ButtonBase>
  )
}

export default IconButton
