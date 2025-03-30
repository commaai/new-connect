import type { VoidComponent } from 'solid-js'
import { createStore } from 'solid-js/store'
import clsx from 'clsx'

import Icon, { type IconName } from '~/components/material/Icon'
import Button from './material/Button'
import { uploadAllSegments, type FileType } from '~/api/upload'
import type { Route } from '~/types'

type ButtonType = 'road' | 'driver' | 'logs' | 'route'
type ButtonState = 'idle' | 'loading' | 'success' | 'error'

const BUTTON_TO_FILE_TYPES: Record<Exclude<ButtonType, 'route'>, FileType[]> = {
  road: ['cameras', 'ecameras'],
  driver: ['dcameras'],
  logs: ['logs'],
}

interface UploadButtonProps {
  state: ButtonState
  onClick?: () => void
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
  route?: Route
}

const RouteUploadButtons: VoidComponent<RouteUploadButtonsProps> = (props) => {
  const [uploadStore, setUploadStore] = createStore({
    states: {
      road: 'idle',
      driver: 'idle',
      logs: 'idle',
      route: 'idle',
    } as Record<ButtonType, ButtonState>,
  })

  const handleUpload = async (type: ButtonType) => {
    if (!props.route) return

    const uploadButtonTypes = type === 'route' ? (['road', 'driver', 'logs'] as const) : [type]
    const uploadFileTypes: FileType[] = []
    for (const type of uploadButtonTypes) {
      const state = uploadStore.states[type]
      if (state === 'loading' || state === 'success') continue
      uploadFileTypes.concat(BUTTON_TO_FILE_TYPES[type])
    }

    setUploadStore('states', uploadButtonTypes, 'loading')
    try {
      await uploadAllSegments(props.route.fullname, props.route.maxqlog + 1, uploadFileTypes)
      setUploadStore('states', type, 'success')
    } catch (err) {
      console.error('Failed to upload', err)
      setUploadStore('states', type, 'error')
    }
  }

  return (
    <div class="flex flex-col rounded-b-md m-5">
      <div class="grid grid-cols-2 gap-3 w-full lg:grid-cols-4">
        <UploadButton text="Road" icon="videocam" state={uploadStore.states.road} onClick={() => handleUpload('road')} />
        <UploadButton text="Driver" icon="person" state={uploadStore.states.driver} onClick={() => handleUpload('driver')} />
        <UploadButton text="Logs" icon="description" state={uploadStore.states.logs} onClick={() => handleUpload('logs')} />
        <UploadButton text="All" icon="upload" state={uploadStore.states.route} onClick={() => handleUpload('route')} />
      </div>
    </div>
  )
}

export default RouteUploadButtons
