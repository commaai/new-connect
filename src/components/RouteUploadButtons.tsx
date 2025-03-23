import { createResource, type VoidComponent, batch } from 'solid-js'
import { createStore } from 'solid-js/store'
import clsx from 'clsx'

import { getRouteWithSegments } from '~/api/route'
import Icon from '~/components/material/Icon'
import Button from './material/Button'
import { FileTypes, uploadAllSegments } from '~/api/upload'

interface UploadButtonProps {
  state: 'idle' | 'loading' | 'success' | 'error'
  onClick?: () => void
  icon: string
  text: string
}

const UploadButton: VoidComponent<UploadButtonProps> = (props) => {
  const icon = () => props.icon
  const state = () => props.state
  const disabled = () => state() === 'loading' || state() === 'success'

  const handleUpload = () => {
    if (disabled()) return

    if (props.onClick) {
      props.onClick()
    }
  }

  const stateToIcon: Record<Exclude<UploadButtonProps['state'], null | undefined>, string> = {
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
      leading={
        <Icon size="20" class={clsx(state() === 'loading' && 'animate-spin')}>
          {stateToIcon[state()]}
        </Icon>
      }
      color="primary"
    >
      <span class="flex items-center gap-1 font-mono">{props.text}</span>
    </Button>
  )
}

type ButtonType = 'cameras' | 'driver' | 'logs' | 'route'

interface RouteUploadButtonsProps {
  routeName: string
}

const RouteUploadButtons: VoidComponent<RouteUploadButtonsProps> = (props) => {
  const [routeResource] = createResource(() => props.routeName, getRouteWithSegments)

  const [uploadStore, setUploadStore] = createStore({
    states: {
      cameras: 'idle',
      driver: 'idle',
      logs: 'idle',
      route: 'idle',
    } as Record<ButtonType, 'idle' | 'loading' | 'success' | 'error'>,
  })

  const updateButtonStates = (types: ButtonType[], state: 'loading' | 'success' | 'error') => {
    batch(() => {
      for (const type of types) {
        setUploadStore('states', type, state)
      }
    })
  }

  const buttonToFileTypeMap: Record<ButtonType, (keyof typeof FileTypes)[] | undefined> = {
    cameras: ['cameras', 'ecameras'],
    driver: ['dcameras'],
    logs: ['logs'],
    route: undefined,
  }

  const handleUpload = async (type: ButtonType) => {
    const route = routeResource()
    if (!route) return

    if (type === 'route') {
      const typesNotUploadedYet = Object.entries(uploadStore.states)
        .filter(([_, state]) => state !== 'loading' && state !== 'success')
        .map(([type]) => type as ButtonType)
        .filter((type) => type !== undefined)

      const typesToUpload = typesNotUploadedYet.flatMap((type) => buttonToFileTypeMap[type]).filter((type) => type !== undefined)

      updateButtonStates(typesNotUploadedYet, 'loading')

      try {
        await uploadAllSegments(props.routeName, route.segment_numbers.length, typesToUpload)
        updateButtonStates(typesNotUploadedYet, 'success')
      } catch (err) {
        console.error('Failed to upload', err)
        updateButtonStates(typesNotUploadedYet, 'error')
      }
      return
    }

    setUploadStore('states', type, 'loading')

    const fileTypesToUpload = buttonToFileTypeMap[type]

    try {
      await uploadAllSegments(props.routeName, route.segment_numbers.length, fileTypesToUpload)
      setUploadStore('states', type, 'success')
    } catch (err) {
      console.error('Failed to upload', err)
      setUploadStore('states', type, 'error')
    }
  }

  return (
    <div class="flex flex-col rounded-b-md m-5">
      <div class="grid grid-cols-2 gap-3 w-full lg:grid-cols-4">
        <UploadButton text="Road" icon="videocam" state={uploadStore.states.cameras} onClick={() => handleUpload('cameras')} />
        <UploadButton text="Driver" icon="person" state={uploadStore.states.driver} onClick={() => handleUpload('driver')} />
        <UploadButton text="Logs" icon="description" state={uploadStore.states.logs} onClick={() => handleUpload('logs')} />
        <UploadButton text="All" icon="upload" state={uploadStore.states.route} onClick={() => handleUpload('route')} />
      </div>
    </div>
  )
}

export default RouteUploadButtons
