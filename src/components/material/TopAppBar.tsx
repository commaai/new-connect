import type { JSXElement, ParentComponent } from 'solid-js'
import clsx from 'clsx'

import Typography from '~/components/material/Typography'

type TopAppBarProps = {
  class?: string
  leading?: JSXElement
  trailing?: JSXElement
  as?: string
}

const TopAppBar: ParentComponent<TopAppBarProps> = (props) => {
  return (
    <div
      class={clsx(
        'inset-x-0 top-0 flex h-16 items-center gap-4 px-4 py-5 text-on-surface',
        props.class,
      )}
    >
      {props.leading}
      <Typography class="grow" as={props.as || 'h2'} variant="title-lg">
        {props.children}
      </Typography>
      {props.trailing}
    </div>
  )
}

export default TopAppBar
