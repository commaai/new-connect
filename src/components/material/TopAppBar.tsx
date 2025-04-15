import type { JSXElement, ParentComponent, ValidComponent } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { cn } from '~/utils/style'

type TopAppBarProps = {
  class?: string
  component?: ValidComponent
  leading?: JSXElement
  trailing?: JSXElement
}

const TopAppBar: ParentComponent<TopAppBarProps> = (props) => {
  return (
    <header class={cn('inset-x-0 top-0 flex h-16 items-center gap-4 px-4 py-5 text-on-surface', props.class)}>
      {props.leading}
      <Dynamic class="grow truncate text-title-lg" component={props.component || 'h1'}>
        {props.children}
      </Dynamic>
      {props.trailing}
    </header>
  )
}

export default TopAppBar
