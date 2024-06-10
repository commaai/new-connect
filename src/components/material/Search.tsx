import type { JSXElement, ParentComponent } from 'solid-js'
import clsx from 'clsx'

type SearchProps = {
  class?: string
  leading?: JSXElement
  trailing?: JSXElement
  expanded?: boolean
  result?: JSXElement
}

const Search: ParentComponent<SearchProps> = (props) => {
  return (
    <div
      class={clsx(
        'elevation-1 min-w-[320px] max-w-[720px] overflow-hidden rounded-xl bg-surface text-on-surface transition-colors',
        props.class,
      )}
    >
      <div class="flex h-14 items-center justify-between gap-4 px-4">
        {props.leading}
        <span class="w-full">{props.children}</span>
        {props.trailing}
      </div>

      {props.expanded && props.result}
    </div>
  )
}

export default Search
