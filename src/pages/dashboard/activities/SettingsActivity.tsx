import { createResource, Match, type ParentComponent, Show, Suspense, Switch, type Accessor, type Setter, type VoidComponent, children, createMemo, JSX, For, createSignal } from 'solid-js'
import clsx from 'clsx'

import { getDevice } from '~/api/devices'
import { getSubscribeInfo, getSubscriptionStatus } from '~/api/prime'
import { formatDate } from '~/utils/date'
import { getDeviceName } from '~/utils/device'

import ButtonBase from '~/components/material/ButtonBase'
import Button from '~/components/material/Button'
import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'
import Icon from '~/components/material/Icon'

const formatCurrency = (amount: number) => `$${(amount / 100).toFixed(amount % 100 == 0 ? 0 : 2)}`

type PrimeActivityProps = {
  dongleId: string
}

type PrimePlan = 'lite' | 'standard'

type PlanProps = {
  name: PrimePlan
  amount: number
  description: string
  disabled?: boolean
}

const Plan = (props: PlanProps) => {
  return props as unknown as JSX.Element
}

const PlanSelector: ParentComponent<{
  plan: Accessor<PrimePlan | undefined>
  setPlan: Setter<PrimePlan | undefined>
}> = (props) => {
  const plansAccessor = children(() => props.children)
  const plans = createMemo<PlanProps[]>(() => {
    const p = plansAccessor()
    return (Array.isArray(p) ? p : [p]) as unknown[] as PlanProps[]
  })

  return <div class="relative">
    <div class="flex w-full gap-2 xs:gap-4">
      <For each={plans()}>
        {(plan) => <ButtonBase
          class={clsx(
            'flex grow basis-0 flex-col items-center justify-center gap-2 rounded-lg p-2 text-center xs:p-4',
            'state-layer bg-tertiary text-on-tertiary transition before:bg-on-tertiary',
            (props.plan() === plan.name) && 'ring-4 ring-on-tertiary',
            plan.disabled && 'cursor-not-allowed opacity-50',
          )}
          onClick={() => props.setPlan(plan.name)}
          disabled={plan.disabled}
        >
          <span class="text-body-lg">{plan.name}</span>
          <span class="text-title-lg font-bold">{formatCurrency(plan.amount)}/month</span>
          <span class="text-label-md">{plan.description}</span>
        </ButtonBase>}
      </For>
    </div>
  </div>
}

const NoPrime: VoidComponent<{ dongleId: string }> = (props) => {
  const [selectedPlan, setSelectedPlan] = createSignal<PrimePlan>()

  const dongleId = () => props.dongleId
  const [device] = createResource(dongleId, getDevice)
  const [subscribeInfo] = createResource(dongleId, getSubscribeInfo)

  const [uiState] = createResource(
    () => ({ device: device(), subscribeInfo: subscribeInfo(), selectedPlan: selectedPlan() }),
    (source) => {
      if (!source.device || !source.subscribeInfo) return null

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

      let checkoutText
      if (source.selectedPlan) {
        checkoutText = trialClaimable ? 'Claim trial' : 'Go to checkout'
      } else {
        checkoutText = 'Select a plan'
        if (trialClaimable) checkoutText += ' to claim trial'
      }

      let chargeText
      if (source.selectedPlan && trialClaimable) {
        chargeText = `Your first charge will be on ${formatDate(trialEndDate)}, then monthly thereafter.`
      }

      let disabledDataPlanText
      if (!source.device.eligible_features?.prime_data) {
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
        chargeText,
        checkoutText,
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

    <PlanSelector plan={selectedPlan} setPlan={setSelectedPlan}>
      <Plan
        name="lite"
        amount={1000}
        description="bring your own sim card"
      />
      <Plan
        name="standard"
        amount={2400}
        description="including data plan, only offered in the U.S."
        disabled={!!uiState()?.disabledDataPlanText}
      />
    </PlanSelector>

    <Show when={uiState()?.disabledDataPlanText} keyed>{text => <div class="flex gap-2 rounded-sm bg-surface-container p-2 text-body-sm">
      <Icon size="20">info</Icon>
      {text}
    </div>}</Show>

    <Show when={uiState()?.checkoutText} keyed>{text => <Button color="tertiary" disabled={uiState()?.trialClaimable === false}>
      {text}
    </Button>}</Show>

    <Show when={uiState()?.chargeText} keyed>{text => <p class="text-label-lg">{text}</p>}</Show>
  </div>
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
      <li>Joined: {formatDate(subscription()?.subscribed_at)}</li>
      <li>Next payment: {formatDate(subscription()?.next_charge_at)}</li>
      <li>Amount: {amount()}</li>
    </div>

    <div class="flex gap-4">
      <Button color="secondary">Update payment method</Button>
      <Button color="error">Cancel subscription</Button>
    </div>
  </div>
}

const SettingsActivity: VoidComponent<PrimeActivityProps> = (props) => {
  const dongleId = () => props.dongleId
  const [device] = createResource(dongleId, getDevice)
  return (
    <>
      <TopAppBar leading={<IconButton href={`/${dongleId()}`}>arrow_back</IconButton>}>
        <Show when={device()} keyed>{device => getDeviceName(device)}</Show>
      </TopAppBar>
      <div class="max-w-lg px-4">
        <h2 class="mb-4 text-headline-sm">Plan and Billing</h2>
        <Suspense>
          <Switch>
            <Match when={device()?.prime === false}>
              <NoPrime dongleId={props.dongleId} />
            </Match>

            <Match when={device()?.prime === true}>
              <Prime dongleId={props.dongleId} />
            </Match>
          </Switch>
        </Suspense>
      </div>
    </>
  )
}

export default SettingsActivity
