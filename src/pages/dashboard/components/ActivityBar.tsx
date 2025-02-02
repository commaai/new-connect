import type { ParentComponent } from 'solid-js'

import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'

interface ActivityBarProps {
  backHref: string
}

const ActivityBar: ParentComponent<ActivityBarProps> = (props) => {
  return (
    <TopAppBar
      leading={<IconButton class="md:hidden" href={props.backHref}>arrow_back</IconButton>}
      trailing={<IconButton class="hidden md:inline-flex" href={props.backHref}>close</IconButton>}
    >
      {props.children}
    </TopAppBar>
  )
}

export default ActivityBar
