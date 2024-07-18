import { createResource, createSignal, Match, Show, Suspense, Switch, type Accessor, type Setter, type VoidComponent } from 'solid-js'
import clsx from 'clsx'

import { getDevice } from '~/api/devices'
import { getSubscribeInfo, getSubscriptionStatus } from '~/api/prime'
import { dayjs } from '~/utils/date'
import { getDeviceName } from '~/utils/device'

import ButtonBase from '~/components/material/ButtonBase'
import Button from '~/components/material/Button'
import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'
import Icon from '~/components/material/Icon'

const formatCurrency = (amount: number) => `$${(amount / 100).toFixed(amount % 100 == 0 ? 0 : 2)}`
const formatDate = (seconds?: number | null, year = false) => seconds ? dayjs.unix(seconds).format('MMMM Do' + (year ? ', YYYY' : '')) : ''

type PrimeActivityProps = {
  dongleId: string
}

type PrimePlan = 'lite' | 'standard'

const PlanCard: VoidComponent<{
  name: PrimePlan
  amount: number
  description: string
  currentPlan: Accessor<PrimePlan | undefined>
  setPlan: Setter<PrimePlan | undefined>
  disabled?: boolean
}> = (props) => {
  return <ButtonBase
    class={clsx(
      'flex grow basis-0 flex-col items-center justify-center',
      'aspect-square gap-2 rounded-lg p-2 py-1 text-center',
      'state-layer bg-tertiary text-on-tertiary transition before:bg-on-tertiary',
      (props.currentPlan() === props.name) && 'ring-4 ring-on-tertiary',
      props.disabled && 'cursor-not-allowed opacity-50',
    )}
    onClick={() => props.setPlan(props.name)}
    disabled={props.disabled}
  >
    <span class="text-body-lg">{props.name}</span>
    <span class="text-title-lg font-bold">{formatCurrency(props.amount)}/month</span>
    <span class="text-label-md">{props.description}</span>
  </ButtonBase>
}

const NoPrime: VoidComponent<{ dongleId: string }> = (props) => {
  const [selectedPlan, setSelectedPlan] = createSignal<PrimePlan>()

  const dongleId = () => props.dongleId
  const [device] = createResource(dongleId, getDevice)
  const [subscribeInfo] = createResource(dongleId, getSubscribeInfo)

  const [uiState] = createResource(
    () => ({ device: device(), subscribeInfo: subscribeInfo(), selectedPlan: selectedPlan() }),
    (source) => {
      if (!source.subscribeInfo) return null

      let trialEndDate, trialClaimable
      if (source.selectedPlan === 'standard') {
        trialEndDate = source.subscribeInfo.trial_end_data
        trialClaimable = !!trialEndDate
      } else if (source.selectedPlan === 'lite') {
        trialEndDate = source.subscribeInfo.trial_end_nodata
        trialClaimable = !!trialEndDate
      } else {
        trialEndDate = null
        trialClaimable = Boolean(source.subscribeInfo.trial_end_data && source.subscribeInfo.trial_end_nodata)
      }

      let disabledDataPlanText
      if (!source.device?.eligible_features?.prime_data) {
        disabledDataPlanText = 'Standard plan is not available for your device.'
      } else if (!source.subscribeInfo.sim_id && source.subscribeInfo.device_online) {
        disabledDataPlanText = 'Standard plan not available, no SIM was detected. Ensure SIM is securely inserted and try again.'
      } else if (!source.subscribeInfo.sim_id) {
        disabledDataPlanText = 'Standard plan not available, device could not be reached. Connect device to the internet and try again.'
      } else if (!source.subscribeInfo.is_prime_sim || !source.subscribeInfo.sim_type) {
        disabledDataPlanText = 'Standard plan not available, detected a third-party SIM.'
      } else if (!['blue', 'magenta_new', 'webbing'].includes(source.subscribeInfo.sim_type)) {
        disabledDataPlanText = ['Standard plan not available, old SIM type detected, new SIM cards are available in the ',
          <a class="text-tertiary underline" href="https://comma.ai/shop/comma-prime-sim" target="_blank">shop</a>]
      } else if (source.subscribeInfo.sim_usable === false && source.subscribeInfo.sim_type === 'blue') {
        disabledDataPlanText = ['Standard plan not available, SIM has been canceled and is therefore no longer usable, new SIM cards are available in the ',
          <a class="text-tertiary underline" href="https://comma.ai/shop/comma-prime-sim" target="_blank">shop</a>]
      } else if (source.subscribeInfo.sim_usable === false) {
        disabledDataPlanText = ['Standard plan not available, SIM is no longer usable, new SIM cards are available in the ',
          <a class="text-tertiary underline" href="https://comma.ai/shop/comma-prime-sim" target="_blank">shop</a>]
      }

      return {
        trialEndDate,
        trialClaimable,

        disabledDataPlanText,
      }
    },
  )

  return <div class="grid gap-4">
    <p>comma prime subscriptions include the following features:</p>

    <ul class="ml-8 list-disc">
      <li>24/7 connectivity</li>
      <li>Take pictures remotely</li>
      <li>1 year storage of drive videos</li>
      <li>Simple SSH for developers</li>
      <li>Turn-by-turn navigation</li>
    </ul>

    <p>
      Learn more from our <a class="text-tertiary underline" href="https://comma.ai/connect#comma-connect-and-prime" target="_blank">FAQ</a>.
    </p>

    <div class="flex w-full gap-8">
      <PlanCard
        name="lite"
        amount={1000}
        description="bring your own sim card"
        currentPlan={selectedPlan}
        setPlan={setSelectedPlan}
      />
      <PlanCard
        name="standard"
        amount={2400}
        description="including data plan, only offered in the U.S."
        currentPlan={selectedPlan}
        setPlan={setSelectedPlan}
        disabled={!!uiState()?.disabledDataPlanText}
      />
    </div>

    <Show when={uiState()?.disabledDataPlanText} keyed>{text => <div class="flex gap-2 rounded-sm bg-surface-container p-2 text-body-sm">
      <Icon size="20">info</Icon>
      {text}
    </div>}</Show>

    <Button color="tertiary" disabled={uiState()?.trialClaimable === false}>
      <Show when={selectedPlan()} fallback="Select a plan to claim trial">
        Claim trial
      </Show>
    </Button>

    <Show when={uiState()?.trialEndDate} keyed>{date => <p>
      Your first charge will be on {formatDate(date)}, then monthly thereafter.
    </p>}</Show>
  </div >
  // return <Show when={subscribeInfo()} keyed>{subscribeInfo => <>
  //   <p>This device doesn't have a prime subscription.</p>
  //   <p>Trial end (no data): {subscribeInfo.trial_end_nodata}</p>
  //   <p>Trial end (data): {subscribeInfo.trial_end_data}</p>
  // </>}</Show>
}

const PrimeType: Record<string, string> = {
  nodata: 'Lite (without data plan)',
  data: 'Standard (with data plan)',
}

const Prime: VoidComponent<{ dongleId: string }> = (props) => {
  const [subscription] = createResource(() => props.dongleId, getSubscriptionStatus)
  const [plan] = createResource(subscription, (subscription) => PrimeType[subscription.plan] ?? 'unknown')
  const [amount] = createResource(subscription, (subscription) => formatCurrency(subscription.amount))

  return <div class="flex flex-col gap-4">
    <div class="flex flex-col">
      <li>Plan: {plan()}</li>
      <li>Joined: {formatDate(subscription()?.subscribed_at, true)}</li>
      <li>Next payment: {formatDate(subscription()?.next_charge_at)}</li>
      <li>Amount: {amount()}</li>
    </div>

    <div class="flex gap-4">
      <Button color="secondary">Update payment method</Button>
      <Button color="error">Cancel subscription</Button>
    </div>
  </div>
}

const PrimeSubscriptionDetails: VoidComponent<{ dongleId: string }> = (props) => {
  const [device] = createResource(() => props.dongleId, getDevice)
  return <Suspense>
    <h2 class="mb-4 text-headline-sm">Plan and Billing</h2>
    <Switch>
      <Match when={device()?.prime === false}>
        <NoPrime dongleId={props.dongleId} />
      </Match>

      <Match when={device()?.prime === true}>
        <Prime dongleId={props.dongleId} />
      </Match>
    </Switch>
  </Suspense>
}

const SettingsActivity: VoidComponent<PrimeActivityProps> = (props) => {
  const dongleId = () => props.dongleId
  const [device] = createResource(dongleId, getDevice)
  const [deviceName] = createResource(device, getDeviceName)
  return (
    <>
      <TopAppBar leading={<IconButton href={`/${dongleId()}`}>arrow_back</IconButton>}>
        {deviceName()}
      </TopAppBar>
      <div class="max-w-lg px-4">
        <PrimeSubscriptionDetails dongleId={dongleId()} />
      </div>
    </>
  )
}

export default SettingsActivity
