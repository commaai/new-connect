import { createResource, Match, Show, Switch, type VoidComponent } from 'solid-js'
import { getDevice } from '~/api/devices'
import { getSubscribeInfo } from '~/api/prime'

import Button from '~/components/material/Button'
import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'
import { getDeviceName } from '~/utils/device'

type PrimeActivityProps = {
  dongleId: string
}

const PrimeActivity: VoidComponent<PrimeActivityProps> = (props) => {
  const dongleId = () => props.dongleId
  // const [subscription] = createResource(dongleId, getSubscriptionStatus)

  const [device] = createResource(dongleId, getDevice)
  const [subscribeInfo] = createResource(dongleId, getSubscribeInfo)

  return (
    <div class="prose grid gap-4 px-4">
      <TopAppBar leading={<IconButton href={`/${dongleId()}`}>arrow_back</IconButton>}>
        Device settings
      </TopAppBar>

      <Show when={device()} keyed>{device => <>
        Device: {getDeviceName(device)} ({device.dongle_id})
      </>}</Show>

      <h2 class="text-headline-md">comma prime</h2>

      <Switch>
        <Match when={subscribeInfo.loading}>
          Loading...
        </Match>

        <Match when={!subscribeInfo()?.has_prime}>
          <span>No prime</span>
        </Match>

        <Match when={subscribeInfo()?.has_prime}>
          <span>Device: Name (dongle id)</span>
          <span>Plan: Lite (without data plan)</span>
          <span>Joined: March 1, 2024</span>
          <span>Next payment: July 31, 2024</span>
          <span>Amount: $10.00</span>

          <Button>Update payment method</Button>
          <Button>Cancel subscription</Button>
        </Match>
      </Switch>
    </div>
  )
}

export default PrimeActivity
