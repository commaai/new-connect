import { type VoidComponent } from 'solid-js'

import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'

type PrimeActivityProps = {
  dongleId: string
}

const PrimeActivity: VoidComponent<PrimeActivityProps> = (props) => {
  return (
    <div>
      <TopAppBar leading={<IconButton href={`/${props.dongleId}`}>arrow_back</IconButton>}>
        Device settings
      </TopAppBar>
    </div>
  )
}

export default PrimeActivity
