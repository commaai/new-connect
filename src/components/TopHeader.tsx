import { useParams } from '@solidjs/router'
import { Component, useContext } from 'solid-js'
import IconButton from '~/components/material/IconButton'
import { DashboardContext } from '~/pages/dashboard/Dashboard'

const TopHeader: Component = () => {
  const dashboardContext = useContext(DashboardContext)!
  const params = useParams()

  return (
    <header class="fixed inset-x-0 top-0 z-10 flex h-[var(--top-header-height)] items-center justify-between border-b-4 border-black bg-[#09090C] p-4 text-white">
      <div class="flex items-center">
        <IconButton onClick={dashboardContext.toggleDrawer} class="text-white">
          menu
        </IconButton>
        <h1 class="ml-4 text-3xl font-bold">connect</h1>
      </div>
      <IconButton href={`/${params.dongleId}/settings`} class="text-white"> 
        settings
      </IconButton>
    </header>
  )
}

export default TopHeader
