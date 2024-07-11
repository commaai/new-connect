import { createResource, Match, Show, Suspense, Switch, type VoidComponent } from 'solid-js'

import { getDevice } from '~/api/devices'
import { getSubscribeInfo, getSubscriptionStatus } from '~/api/prime'
import type { Device } from '~/types'
import { getDeviceName } from '~/utils/device'

import Button from '~/components/material/Button'
import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'

type PrimeActivityProps = {
  dongleId: string
}

const SubscribeInfo: VoidComponent<{ device: Device }> = (props) => {
  const [subscribeInfo] = createResource(() => props.device.dongle_id, getSubscribeInfo)
  return <>
    Trial end (no data): {subscribeInfo()?.trial_end_nodata}
  </>
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

const Subscription: VoidComponent<{ device: Device }> = (props) => {
  const [subscription] = createResource(() => props.device.dongle_id, getSubscriptionStatus)
  const [amount] = createResource(subscription, (sub) => currency.format(sub.amount / 100))

  return <>
    <ul>
      <li>Plan: Lite (without data plan)</li>
      <li>Joined: March 1, 2024</li>
      <li>Next payment: July 31, 2024</li>
      <li>Amount: {amount()}</li>
    </ul>

    <div class="flex gap-4">
      <Button>Update payment method</Button>
      <Button>Cancel subscription</Button>
    </div>
  </>
}

const PrimeActivity: VoidComponent<PrimeActivityProps> = (props) => {
  const dongleId = () => props.dongleId
  const [device] = createResource(dongleId, getDevice)

  return (
    <div class="prose grid gap-4 px-4">
      <TopAppBar leading={<IconButton href={`/${dongleId()}`}>arrow_back</IconButton>}>
        Device settings
      </TopAppBar>

      <Show when={device()} keyed>{device => <>
        Device: {getDeviceName(device)} ({device.dongle_id})
      </>}</Show>

      <h2 class="text-headline-md">comma prime</h2>

      <Suspense fallback="Loading...">
        <Switch>
          <Match when={device()?.prime === true}>
            <Subscription device={device()!} />
          </Match>

          <Match when={device()?.prime === false}>
            <SubscribeInfo device={device()!} />
          </Match>
        </Switch>
      </Suspense>
    </div>
  )
}

export default PrimeActivity
