import { createEffect, createSignal, on, type VoidComponent } from 'solid-js'
import { createStore } from 'solid-js/store'
import clsx from 'clsx'

import Icon, { type IconName } from '~/components/material/Icon'
import Button from './material/Button'
import { uploadAllSegments, type FileType } from '~/api/file'
import type { Route } from '~/api/types'

const BUTTON_TYPES = ['road', 'driver', 'logs', 'route'] as const
type ButtonType = (typeof BUTTON_TYPES)[number]
type ButtonState = 'idle' | 'loading' | 'success' | 'error'

const BUTTON_TO_FILE_TYPES = {
  road: ['cameras', 'ecameras'],
  driver: ['dcameras'],
  logs: ['logs'],
} as const

interface UploadButtonProps {
  state: ButtonState
  onClick: () => void
  icon: IconName
  text: string
}

const UploadButton: VoidComponent<UploadButtonProps> = (props) => {
  const icon = () => props.icon
  const state = () => props.state
  const disabled = () => state() === 'loading' || state() === 'success'

  const handleUpload = () => {
    if (disabled()) return
    props.onClick?.()
  }

  const stateToIcon: Record<ButtonState, IconName> = {
    idle: icon(),
    loading: 'progress_activity',
    success: 'check',
    error: 'error',
  }

  return (
    <Button
      onClick={() => handleUpload()}
      class="px-2 md:px-3"
      disabled={disabled()}
      leading={<Icon class={clsx(state() === 'loading' && 'animate-spin')} name={stateToIcon[state()]} size="20" />}
      color="primary"
    >
      <span class="flex items-center gap-1 font-mono">{props.text}</span>
    </Button>
  )
}

interface RouteUploadButtonsProps {
  route: Route | undefined
}

const RouteUploadButtons: VoidComponent<RouteUploadButtonsProps> = (props) => {
  const [uploadStore, setUploadStore] = createStore<Record<ButtonType, ButtonState>>({
    road: 'idle',
    driver: 'idle',
    logs: 'idle',
    route: 'idle',
  })
  const [abortController, setAbortController] = createSignal(new AbortController())

  createEffect(
    on(
      () => props.route,
      () => {
        abortController().abort()
        setAbortController(new AbortController())
        setUploadStore(BUTTON_TYPES, 'idle')
      },
    ),
  )

  const handleUpload = async (type: ButtonType) => {
    if (!props.route) return
    const { fullname, maxqlog } = props.route
    const { signal } = abortController()

    const updateButtonStates = (types: readonly ButtonType[], state: ButtonState) => {
      if (signal.aborted) return
      setUploadStore(types, state)
    }

    const uploadButtonTypes: ButtonType[] = [type]
    let uploadFileTypes: FileType[] = []
    for (const check of type === 'route' ? (['road', 'driver', 'logs'] as const) : [type]) {
      const state = uploadStore[check]
      if (state === 'loading' || state === 'success') continue
      uploadButtonTypes.push(check)
      uploadFileTypes = uploadFileTypes.concat(BUTTON_TO_FILE_TYPES[check])
    }

    updateButtonStates(uploadButtonTypes, 'loading')
    try {
      await uploadAllSegments(fullname, maxqlog + 1, uploadFileTypes)
      updateButtonStates(uploadButtonTypes, 'success')
    } catch (err) {
      console.error('Failed to upload', err)
      updateButtonStates(uploadButtonTypes, 'error')
    }
  }

  return (
    <div class="flex flex-col rounded-b-md m-5">
      <div class="grid grid-cols-2 gap-3 w-full lg:grid-cols-4">
        <UploadButton text="Road" icon="videocam" state={uploadStore.road} onClick={() => handleUpload('road')} />
        <UploadButton text="Driver" icon="person" state={uploadStore.driver} onClick={() => handleUpload('driver')} />
        <UploadButton text="Logs" icon="description" state={uploadStore.logs} onClick={() => handleUpload('logs')} />
        <UploadButton text="All" icon="upload" state={uploadStore.route} onClick={() => handleUpload('route')} />
      </div>
    </div>
  )
}

export default RouteUploadButtons
