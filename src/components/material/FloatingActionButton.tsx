import type { JSXElement, ParentComponent } from 'solid-js'
import clsx from 'clsx'

import ButtonBase, { ButtonBaseProps } from '~/components/material/ButtonBase'

type FloatingActionButtonProps = ButtonBaseProps & {
  leading?: JSXElement
}

const FloatingActionButton: ParentComponent<FloatingActionButtonProps> = (
  props,
) => {
  return (
    <ButtonBase
      class={clsx(
        'elevation-1 state-layer flex items-center gap-2 rounded-lg bg-primary-container p-4 text-on-primary-container before:bg-on-primary-container',
        props.class,
      )}
      onClick={props.onClick}
    >
      {props.leading}
      <span class="text-label-lg">{props.children}</span>
    </ButtonBase>
  )
}

export default FloatingActionButton
