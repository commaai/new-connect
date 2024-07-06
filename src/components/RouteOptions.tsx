import { createSignal, createEffect, type Component } from 'solid-js'
import type { Route } from '~/types'

type RouteOptionsProps = {
  route?: Route;
}

const RouteOptions: Component<RouteOptionsProps> = (props) => {
  const [isPreservedChecked, setIsPreservedChecked] = createSignal(true)
  const [isPublicAccessChecked, setIsPublicAccessChecked] = createSignal(false)

  const [routeId, setRouteId] = createSignal<string | undefined>()

  createEffect(() => {
    const routeFullName = props?.route?.fullname
    setRouteId(routeFullName?.split('|')[1])
  })

  return (
    <div class="mt-6 flex w-full flex-col gap-6 rounded-lg bg-surface p-5 md:w-[400px]">
      <div class="flex justify-between">
        <div class="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md bg-surface-bright p-2 px-12 py-2.5 font-semibold hover:opacity-80">
          <span class="material-symbols-outlined icon-filled">file_copy</span>
          Route ID
        </div>
        <div class="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md bg-surface-bright p-2 px-12 py-2.5 font-semibold hover:opacity-80">
          <span class="material-symbols-outlined icon-filled">share</span>
          Share
        </div>
      </div>
      <div class="flex items-center gap-2 rounded-md bg-surface-bright p-3 text-sm font-semibold">
        Route ID: <span class="font-regular">{routeId()}</span>
      </div>
      <div class="flex flex-col rounded-md bg-surface-bright">
        <div class="flex items-center justify-between border-b border-gray-900 p-3 pr-5 text-[15px] font-semibold">
          Preserved
          <label class="custom-switch">
            <input type="checkbox" checked={isPreservedChecked()} onChange={(e) => setIsPreservedChecked(e.currentTarget.checked)} />
            <span class="custom-slider round" />
          </label>
        </div>
        <div class="flex items-center justify-between border-b border-gray-900 p-3 pr-5 text-[15px] font-semibold">
          Public Access
          <label class="custom-switch">
            <input type="checkbox" checked={isPublicAccessChecked()} onChange={(e) => setIsPublicAccessChecked(e.currentTarget.checked)} />
            <span class="custom-slider round" />
          </label>
        </div>
      </div>
      <div class="flex flex-col rounded-md bg-surface-bright">
        <div class="flex cursor-pointer items-center justify-between border-b border-gray-900 p-3 pr-4 text-[15px] font-semibold hover:opacity-60">
          View in useradmin
          <span class="material-symbols-outlined text-[35px]">
            keyboard_arrow_right
          </span>
        </div>
        <div class="flex cursor-pointer items-center justify-between border-b border-gray-900 p-3 pr-5 text-[15px] font-semibold hover:opacity-60">
          Upload Options
          <span class="material-symbols-outlined icon-filled text-[25px]">
            cloud_upload
          </span>
        </div>
      </div>
    </div>
  )
}

export default RouteOptions
