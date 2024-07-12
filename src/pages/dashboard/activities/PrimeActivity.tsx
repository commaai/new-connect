import { createResource, Match, Show, Suspense, Switch, type VoidComponent } from 'solid-js'

import { getDevice } from '~/api/devices'
import { getSubscribeInfo, getSubscriptionStatus, SubscribeInfo, SubscriptionStatus } from '~/api/prime'
import type { Device } from '~/types'
import { dayjs } from '~/utils/date'
import { getDeviceName } from '~/utils/device'

import Button from '~/components/material/Button'
import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'

type PrimeActivityProps = {
  dongleId: string
}

const NoPrime: VoidComponent<{
  device: Device
  subscribeInfo: SubscribeInfo
}> = (props) => {
  return <>Trial end (no data): {props.subscribeInfo.trial_end_nodata}</>
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

const PrimeType: Record<string, string> = {
  nodata: 'Lite (without data plan)',
  data: 'Standard (with data plan)',
}

const Prime: VoidComponent<{ device: Device; subscription: SubscriptionStatus }> = (props) => {
  const plan = () => PrimeType[props.device.prime_type] ?? 'unknown'
  const amount = () => currency.format(props.subscription.amount / 100)

  const formatDate = (seconds?: number) => seconds ? dayjs.unix(seconds).format('MMMM Do, YYYY') : ''

  return <div class="flex flex-col gap-4">
    <div class="flex flex-col">
      <li>Plan: {plan()}</li>
      <li>Joined: {formatDate(props.subscription.subscribed_at)}</li>
      <li>Next payment: {formatDate(props.subscription.next_charge_at)}</li>
      <li>Amount: {amount()}</li>
    </div>

    <div class="flex gap-4">
      <Button color="secondary">Update payment method</Button>
      <Button color="error">Cancel subscription</Button>
    </div>
  </div>
}

const PrimeActivity: VoidComponent<PrimeActivityProps> = (props) => {
  const dongleId = () => props.dongleId

  const [device] = createResource(dongleId, getDevice)
  const [subscribeInfo] = createResource(dongleId, getSubscribeInfo)
  const [subscription] = createResource(dongleId, getSubscriptionStatus)

  return (
    <div class="prose grid max-w-lg gap-4 px-4">
      <TopAppBar leading={<IconButton href={`/${dongleId()}`}>arrow_back</IconButton>}>
        Device settings
      </TopAppBar>

      <Show when={device()} keyed>{device => <span class="text-body-md">
        Device: {getDeviceName(device)} <span class="text-body-sm text-white/70">({device.dongle_id})</span>
      </span>}</Show>

      <hr />

      <h2 class="text-headline-sm">comma prime</h2>

      <Suspense fallback="Loading...">
        <Switch>
          <Match when={device()?.prime === false}>
            <NoPrime device={device()!} subscribeInfo={subscribeInfo()} />
          </Match>

          <Match when={device()?.prime === true}>
            <Prime device={device()!} subscription={subscription()} />
          </Match>
        </Switch>
      </Suspense>
    </div>
  )
}

export default PrimeActivity
