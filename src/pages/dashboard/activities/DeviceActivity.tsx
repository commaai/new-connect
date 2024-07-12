import { createResource, Suspense, useContext, createSignal } from 'solid-js'
import type { VoidComponent } from 'solid-js'

import { getDevice } from '~/api/devices'
import { getAccessToken } from '~/api/auth/client'

import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'
import DeviceStatistics from '~/components/DeviceStatistics'
import { getDeviceName } from '~/utils/device'

import RouteList from '../components/RouteList'
import { DashboardContext } from '../Dashboard'

type DeviceActivityProps = {
  dongleId: string
}

const DeviceActivity: VoidComponent<DeviceActivityProps> = (props) => {
  const { toggleDrawer } = useContext(DashboardContext)!

  const [device] = createResource(() => props.dongleId, getDevice)
  const [deviceName] = createResource(device, getDeviceName)
  const [snapshot, setSnapshot] = createSignal({ error: null, fetching: false, image: null })

  const takeSnapshot = async () => {
    console.log('Starting snapshot process...')
    setSnapshot({ error: null, fetching: true, image: null })
  
    try {
      const payload = {
        method: 'takeSnapshot',
        jsonrpc: '2.0',
        id: 0,
      }
  
      const response = await fetch(`https://athena.comma.ai/${props.dongleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `JWT ${getAccessToken()}`,
        },
        body: JSON.stringify(payload),
      })
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
  
      const resp = await response.json()
      const image = resp.result?.jpegFront || resp.result?.jpegBack
  
      if (image) {
        console.log('Snapshot fetched successfully:', image)
        setSnapshot({ error: null, fetching: false, image })
      } else {
        throw new Error('No image found.')
      }
    } catch (err) {
      console.error('Error fetching snapshot:', err)
      let error = err.message
  
      if (error.includes('Device not registered')) {
        error = 'Device offline'
      } else if (error.length > 5 && error[5] === '{') {
        try {
          error = JSON.parse(error.substring(5)).error
        } catch {
          // pass
        }
      }
  
      setSnapshot({ error, fetching: false, image: null })
    }
  }

  return (
    <>
      <style>
        {`
          .spin {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .thumbnail img {
            width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .loading, .error {
            text-align: center;
            margin-top: 20px;
          }
        `}
      </style>
      <TopAppBar leading={<IconButton onClick={toggleDrawer}>menu</IconButton>}>
        {deviceName()}
        <IconButton onClick={takeSnapshot} class={snapshot().fetching ? 'spin' : ''}>camera</IconButton>
      </TopAppBar>
      <div class="flex flex-col gap-4 px-4 pb-4">
        <div class="flex gap-4">
          <div class="flex-1 h-[72px] overflow-hidden rounded-lg bg-surface-container-low">
            <Suspense fallback={<div class="skeleton-loader size-full" />}>
              <div class="p-4">
                <DeviceStatistics dongleId={props.dongleId} />
              </div>
            </Suspense>
          </div>
          {snapshot().image && (
            <div class="flex-1 overflow-hidden rounded-lg bg-surface-container-low">
              <div class="p-4 thumbnail">
                <img src={`data:image/jpeg;base64,${snapshot().image}`} alt="Device Snapshot" />
              </div>
            </div>
          )}
          {snapshot().fetching && <div class="loading">Loading snapshot...</div>}
          {snapshot().error && <div class="error">Error: {snapshot().error}</div>}
        </div>
        <div class="flex flex-col gap-2">
          <span class="text-label-sm">Routes</span>
          <RouteList dongleId={props.dongleId} />
        </div>
      </div>
    </>
  )
}

export default DeviceActivity
