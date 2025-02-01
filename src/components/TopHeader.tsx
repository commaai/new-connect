import { Component, useContext } from 'solid-js'
import IconButton from '~/components/material/IconButton'
import { DashboardContext } from '~/pages/dashboard/Dashboard'

const TopHeader: Component = () => {
  const { toggleDrawer, isDesktop, isDrawerOpen, dongleId } = useContext(DashboardContext)!
  const settingsUrl = () => `/${dongleId()}/settings`

  return (
    <header class="fixed inset-x-0 top-0 z-10 flex h-[var(--top-header-height)] items-center justify-between border-b-8 border-black bg-[#09090C] p-4 text-white">
      <div class="flex items-center">
        {!isDesktop() && (
          <IconButton onClick={toggleDrawer} class="text-white">
            menu
          </IconButton>
        )}
        <h1>
          <a
            href="/"
            class="ml-2 text-3xl font-bold hover:opacity-80"
            onClick={() => isDrawerOpen() && toggleDrawer()}
          >
            connect
          </a>
        </h1>
      </div>
      <IconButton
        href={settingsUrl()}
        class="text-white"
        onClick={() => isDrawerOpen() && toggleDrawer()}
      >
        settings
      </IconButton>
    </header>
  )
}

export default TopHeader
