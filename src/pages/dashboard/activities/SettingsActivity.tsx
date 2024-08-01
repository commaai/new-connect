import { createResource, Match, type ParentComponent, Show, Suspense, Switch, type Accessor, type Setter, type VoidComponent, children, createMemo, JSX, For, createSignal, type Resource, createEffect } from 'solid-js'
import { useLocation } from '@solidjs/router'
import clsx from 'clsx'

import { getDevice } from '~/api/devices'
import { cancelSubscription, getStripeCheckout, getStripePortal, getStripeSession, getSubscribeInfo, getSubscriptionStatus } from '~/api/prime'
import { formatDate } from '~/utils/date'
import { getDeviceName } from '~/utils/device'

import ButtonBase from '~/components/material/ButtonBase'
import Button from '~/components/material/Button'
import CircularProgress from '~/components/material/CircularProgress'
import Icon from '~/components/material/Icon'
import IconButton from '~/components/material/IconButton'
import TopAppBar from '~/components/material/TopAppBar'
import { createQuery } from '~/utils/createQuery'

const useAction = <T,>(action: () => Promise<T>): [() => void, Resource<T>] => {
  const [source, setSource] = createSignal(false)
  const [data] = createResource(source, action)
  const trigger = () => setSource(true)
  return [trigger, data]
}

const formatCurrency = (amount: number) => `$${(amount / 100).toFixed(amount % 100 == 0 ? 0 : 2)}`

type PrimeActivityProps = {
  dongleId: string
}

type PrimePlan = 'nodata' | 'data'

type PlanProps = {
  name: PrimePlan
  amount: number
  description: string
  disabled?: boolean
}

const PrimePlanName: Record<PrimePlan, string> = {
  nodata: 'Lite',
  data: 'Standard',
}

const Plan = (props: PlanProps) => {
  return props as unknown as JSX.Element
}

const PlanSelector: ParentComponent<{
  plan: Accessor<PrimePlan | undefined>
  setPlan: Setter<PrimePlan | undefined>
  disabled?: boolean
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
          disabled={plan.disabled || props.disabled}
        >
          <span class="text-body-lg">{PrimePlanName[plan.name].toLowerCase()}</span>
          <span class="text-title-lg font-bold">{formatCurrency(plan.amount)}/month</span>
          <span class="text-label-md">{plan.description}</span>
        </ButtonBase>}
      </For>
    </div>
  </div>
}

const PrimeCheckout: VoidComponent<{ dongleId: string }> = (props) => {
  const [selectedPlan, setSelectedPlan] = createSignal<PrimePlan>()

  const dongleId = () => props.dongleId
  const [device] = createResource(dongleId, getDevice)
  const [subscribeInfo] = createResource(dongleId, getSubscribeInfo)

  const stripeCancelled = () => new URLSearchParams(useLocation().search).has('stripe_cancelled')

  const [checkout, checkoutData] = useAction(async () => {
    const { url } = await getStripeCheckout(dongleId(), subscribeInfo()!.sim_id!, selectedPlan()!)
    if (url) {
      window.location.href = url
    }
  })

  const isLoading = () => subscribeInfo.loading || checkoutData.loading

  const [uiState] = createResource(
    () => ({ device: device(), subscribeInfo: subscribeInfo(), selectedPlan: selectedPlan() }),
    (source) => {
      if (!source.device || !source.subscribeInfo) return null

      let trialEndDate, trialClaimable
      if (source.selectedPlan === 'data') {
        trialEndDate = source.subscribeInfo.trial_end_data
        trialClaimable = !!trialEndDate
      } else if (source.selectedPlan === 'nodata') {
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

    <Show when={stripeCancelled()}>
      <div class="flex gap-2 rounded-sm bg-surface-container p-2 text-body-md text-on-surface">
        <Icon class="text-error" size="20">error</Icon>
        Checkout cancelled
      </div>
    </Show>

    <PlanSelector plan={selectedPlan} setPlan={setSelectedPlan} disabled={isLoading()}>
      <Plan
        name="nodata"
        amount={1000}
        description="bring your own sim card"
      />
      <Plan
        name="data"
        amount={2400}
        description="including data plan, only offered in the U.S."
        disabled={!!uiState()?.disabledDataPlanText}
      />
    </PlanSelector>

    <Show when={uiState()?.disabledDataPlanText} keyed>{text => <div class="flex gap-2 rounded-sm bg-surface-container p-2 text-body-md text-on-surface">
      <Icon size="20">info</Icon>
      {text}
    </div>}</Show>

    <Show when={uiState()?.checkoutText} keyed>{text =>
      <Button
        color="tertiary"
        disabled={!selectedPlan()}
        loading={checkoutData.loading}
        onClick={checkout}
      >
        {text}
      </Button>
    }</Show>

    <Show when={uiState()?.chargeText} keyed>{text => <p class="text-label-lg">{text}</p>}</Show>
  </div>
}

const PrimeManage: VoidComponent<{ dongleId: string }> = (props) => {
  const stripeSessionId = () => new URLSearchParams(useLocation().search).get('stripe_success')

  const [stripeSession] = createQuery({
    source: () => {
      const source = [props.dongleId, stripeSessionId()]
      if (source.some((param) => !param)) return null
      return source as [string, string]
    },
    fetcher: ([dongleId, stripeSessionId]) => getStripeSession(dongleId, stripeSessionId),
    refetchInterval: 10_000,
    stopCondition: (session) => session?.payment_status === 'paid',
  })

  // TODO: we should wait for the session to be paid before fetching subscription
  const [subscription] = createQuery({
    source: () => props.dongleId,
    fetcher: getSubscriptionStatus,
    retryInterval: 10_000,
  })

  const [cancelDialog, setCancelDialog] = createSignal(false)
  const [cancel, cancelData] = useAction(() => cancelSubscription(props.dongleId))
  const [update, updateData] = useAction(async () => {
    const { url } = await getStripePortal(props.dongleId)
    if (url) {
      window.location.href = url
    }
  })
  const loading = () => subscription.loading || cancelData.loading || updateData.loading || stripeSession.loading

  createEffect(() => {
    if (cancelData.state !== 'ready') return
    setTimeout(() => window.location.reload(), 5000)
  })

  return <div class="flex flex-col gap-4">
    <Suspense
      fallback={<div class="my-2 flex flex-col items-center gap-4">
        <CircularProgress />
        Fetching subscription status...
      </div>}
    >
      <Switch>
        <Match when={stripeSession.state === 'errored'}>
          <div class="flex gap-2 rounded-sm bg-on-error-container p-2 text-body-md font-semibold text-error-container">
            <Icon size="20">error</Icon>
            Unable to check payment status: {stripeSession.error}
          </div>
        </Match>
        <Match when={stripeSession()?.payment_status} keyed>{paymentStatus =>
          <Switch>
            <Match when={paymentStatus === 'unpaid'}>
              <div class="flex gap-2 rounded-sm bg-surface-container p-2 text-body-md text-on-surface">
                <Icon size="20">payments</Icon>
                Waiting for confirmed payment...
              </div>
            </Match>

            <Match when={paymentStatus === 'paid' && !subscription()}>
              <div class="flex gap-2 rounded-sm bg-surface-container p-2 text-body-md text-on-surface">
                <Icon size="20">sync</Icon>
                Processing subscription...
              </div>
            </Match>

            <Match when={paymentStatus === 'paid' && subscription()}>
              <div class="flex gap-2 rounded-sm bg-tertiary-container p-2 text-body-md text-on-tertiary-container">
                <Icon size="20">check</Icon>
                <div class="flex flex-col gap-2">
                  <p class="font-semibold">comma prime activated</p>
                  <Show when={subscription()?.is_prime_sim} keyed>
                    Connectivity will be enabled as soon as activation propogates to your local cell tower.
                    Rebooting your device may help.
                  </Show>
                </div>
              </div>
            </Match>
          </Switch>
        }</Match>
      </Switch>

      <Switch>
        <Match when={cancelData.state === 'errored'}>
          <div class="flex gap-2 rounded-sm bg-surface-container p-2 text-body-md text-on-surface">
            <Icon class="text-error" size="20">error</Icon>
            Failed to cancel subscription: {cancelData.error}
          </div>
        </Match>

        <Match when={cancelData.state === 'ready'}>
          <div class="flex gap-2 rounded-sm bg-surface-container p-2 text-body-md text-on-surface">
            <Icon size="20">check</Icon>
            Subscription cancelled
          </div>
        </Match>
      </Switch>

      <Switch>
        <Match when={subscription.state === 'errored'}>
          Unable to fetch subscription details: {subscription.error}
        </Match>
        <Match when={subscription()} keyed>{subscription =>
          <>
            <div class="flex list-none flex-col">
              <li>Plan: {PrimePlanName[subscription.plan as PrimePlan] ?? 'unknown'}</li>
              <li>Amount: {formatCurrency(subscription.amount)}</li>
              <li>Joined: {formatDate(subscription.subscribed_at)}</li>
              <li>Next payment: {formatDate(subscription.next_charge_at)}</li>
            </div>

            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button color="error" disabled={loading()} loading={cancelData.loading} onClick={() => setCancelDialog(true)}>Cancel subscription</Button>
              <Button color="secondary" disabled={loading()} loading={updateData.loading} onClick={update}>Update payment method</Button>
            </div>
          </>
        }</Match>
      </Switch>
    </Suspense>

    <Show when={cancelDialog()}>
      <div class="bg-scrim/10 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => setCancelDialog(false)}>
        <div class="flex size-full flex-col gap-4 bg-surface-container p-6 sm:h-auto sm:max-w-lg sm:rounded-lg sm:shadow-lg">
          <h2 class="text-headline-sm">Cancel subscription</h2>
          <p class="text-body-md">Are you sure you want to cancel your subscription?</p>
          <div class="mt-4 flex flex-wrap justify-stretch gap-4">
            <Button color="error" disabled={loading()} loading={cancelData.loading} onClick={() => {
              cancel()
              setCancelDialog(false)
            }}>Yes, cancel subscription</Button>
            <Button color="secondary" disabled={loading()} onClick={() => setCancelDialog(false)}>No, keep subscription</Button>
          </div>
        </div>
      </div>
    </Show>
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
        <h2 class="mb-4 text-headline-sm">comma prime</h2>
        <Suspense>
          <Switch>
            <Match when={device()?.prime === false}>
              <PrimeCheckout dongleId={props.dongleId} />
            </Match>

            <Match when={device()?.prime === true}>
              <PrimeManage dongleId={props.dongleId} />
            </Match>
          </Switch>
        </Suspense>
      </div>
    </>
  )
}

export default SettingsActivity
