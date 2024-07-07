import { useContext } from 'solid-js'
import type { VoidComponent } from 'solid-js'

import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'

import { DashboardContext } from '../Dashboard'

const PairActivity: VoidComponent = () => {
  const { toggleDrawer } = useContext(DashboardContext)!

  return (
    <>
      <TopAppBar leading={<IconButton onClick={toggleDrawer}>menu</IconButton>}>
        Pair new device
      </TopAppBar>
      <div class="flex flex-col gap-4 px-4 pb-4">
        TODO
      </div>
    </>
  )
}

export default PairActivity
