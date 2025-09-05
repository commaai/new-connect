import { createResource, Match, Show, Suspense, Switch, children, createMemo, For, createSignal, createEffect } from 'solid-js'
import type { Accessor, VoidComponent, Setter, ParentComponent, Resource, JSXElement } from 'solid-js'
import { useLocation } from '@solidjs/router'
import clsx from 'clsx'

import { getDevice, unpairDevice } from '~/api/devices'
import {
  cancelSubscription,
  getStripeCheckout,
  getStripePortal,
  getStripeSession,
  getSubscribeInfo,
  getSubscriptionStatus,
} from '~/api/prime'
import { describeSim, setSimProfile } from '~/api/athena'
import type { Device, SimProfile } from '~/api/types'
import { formatDate } from '~/utils/format'

import ButtonBase from '~/components/material/ButtonBase'
import Button from '~/components/material/Button'
import Icon from '~/components/material/Icon'
import { createQuery } from '~/utils/createQuery'
import { getDeviceName } from '~/utils/device'
import { useDrawerContext } from '~/components/material/Drawer'

const useAction = <T,>(action: () => Promise<T>): [() => void, Resource<T>] => {
  const [source, setSource] = createSignal(false)
  const [data] = createResource(source, action)
  const trigger = () => setSource(true)
  return [trigger, data]
}

const formatCurrency = (amount: number) => `$${(amount / 100).toFixed(amount % 100 === 0 ? 0 : 2)}`

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
  return props as unknown as JSXElement
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

  return (
    <div class="relative">
      <div class="flex w-full gap-2 xs:gap-4">
        <For each={plans()}>
          {(plan) => (
            <ButtonBase
              class={clsx(
                'flex grow basis-0 flex-col items-center justify-center gap-2 rounded-lg p-2 text-center xs:p-4',
                'state-layer bg-tertiary text-on-tertiary transition before:bg-on-tertiary',
                props.plan() === plan.name && 'ring-4 ring-on-tertiary',
                plan.disabled && 'cursor-not-allowed opacity-50',
              )}
              onClick={() => props.setPlan(plan.name)}
              disabled={plan.disabled || props.disabled}
            >
              <span class="text-md">{PrimePlanName[plan.name].toLowerCase()}</span>
              <span class="text-lg font-bold">{formatCurrency(plan.amount)}/month</span>
              <span class="text-xs">{plan.description}</span>
            </ButtonBase>
          )}
        </For>
      </div>
    </div>
  )
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

      let trialEndDate: number | null, trialClaimable: boolean
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

      let checkoutText: string
      if (source.selectedPlan) {
        checkoutText = trialClaimable ? 'Claim trial' : 'Go to checkout'
      } else {
        checkoutText = 'Select a plan'
        if (trialClaimable) checkoutText += ' to claim trial'
      }

      let chargeText: string = ''
      if (source.selectedPlan && trialClaimable) {
        chargeText = `Your first charge will be on ${formatDate(trialEndDate)}, then monthly thereafter.`
      }

      let disabledDataPlanText: JSXElement
      if (!source.device.eligible_features?.prime_data) {
        disabledDataPlanText = 'Standard plan is not available for your device.'
      } else if (!source.subscribeInfo.sim_id && source.subscribeInfo.device_online) {
        disabledDataPlanText = 'Standard plan not available, no SIM was detected. Ensure SIM is securely inserted and try again.'
      } else if (!source.subscribeInfo.sim_id) {
        disabledDataPlanText = 'Standard plan not available, device could not be reached. Connect device to the internet and try again.'
      } else if (!source.subscribeInfo.is_prime_sim || !source.subscribeInfo.sim_type) {
        disabledDataPlanText = 'Standard plan not available, detected a third-party SIM.'
      } else if (!['blue', 'magenta_new', 'webbing'].includes(source.subscribeInfo.sim_type)) {
        disabledDataPlanText = [
          'Standard plan not available, old SIM type detected, new SIM cards are available in the ',
          <a class="text-tertiary underline" href="https://comma.ai/shop/comma-prime-sim" target="_blank">
            shop
          </a>,
        ]
      } else if (source.subscribeInfo.sim_usable === false && source.subscribeInfo.sim_type === 'blue') {
        disabledDataPlanText = [
          'Standard plan not available, SIM has been canceled and is therefore no longer usable, new SIM cards are available in the ',
          <a class="text-tertiary underline" href="https://comma.ai/shop/comma-prime-sim" target="_blank">
            shop
          </a>,
        ]
      } else if (source.subscribeInfo.sim_usable === false) {
        disabledDataPlanText = [
          'Standard plan not available, SIM is no longer usable, new SIM cards are available in the ',
          <a class="text-tertiary underline" href="https://comma.ai/shop/comma-prime-sim" target="_blank">
            shop
          </a>,
        ]
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

  return (
    <div class="grid gap-4">
      <ul class="ml-8 list-disc">
        <li>24/7 connectivity</li>
        <li>Take pictures remotely</li>
        <li>1 year storage of drive videos</li>
        <li>Simple SSH for developers</li>
      </ul>

      <p>
        Learn more from our{' '}
        <a class="text-tertiary underline" href="https://comma.ai/connect#comma-connect-and-prime" target="_blank">
          FAQ
        </a>
        .
      </p>

      <Show when={stripeCancelled()}>
        <div class="flex gap-2 rounded-sm bg-surface-container p-2 text-sm text-on-surface">
          <Icon name="error" class="text-error" size="20" />
          Checkout cancelled
        </div>
      </Show>

      <PlanSelector plan={selectedPlan} setPlan={setSelectedPlan} disabled={isLoading()}>
        <Plan name="nodata" amount={1000} description="bring your own sim card" />
        <Plan
          name="data"
          amount={2400}
          description="including data plan, only offered in the U.S."
          disabled={!!uiState()?.disabledDataPlanText}
        />
      </PlanSelector>

      <Show when={uiState()?.disabledDataPlanText} keyed>
        {(text) => (
          <div class="flex gap-2 rounded-sm bg-surface-container p-2 text-sm text-on-surface">
            <Icon name="info" size="20" />
            {text}
          </div>
        )}
      </Show>

      <Show when={uiState()?.checkoutText} keyed>
        {(text) => (
          <Button color="tertiary" disabled={!selectedPlan()} loading={checkoutData.loading} onClick={checkout}>
            {text}
          </Button>
        )}
      </Show>

      <Show when={uiState()?.chargeText} keyed>
        {(text) => <p class="text-sm">{text}</p>}
      </Show>
    </div>
  )
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

  return (
    <div class="flex flex-col gap-4">
      <Suspense
        fallback={
          <div class="my-2 flex flex-col items-center gap-4">
            <Icon name="autorenew" class="animate-spin" size="40" />
            <span class="text-md">Fetching subscription status...</span>
          </div>
        }
      >
        <Switch>
          <Match when={stripeSession.state === 'errored'}>
            <div class="flex gap-2 rounded-sm bg-on-error-container p-2 text-sm font-semibold text-error-container">
              <Icon name="error" size="20" />
              Unable to check payment status: {stripeSession.error}
            </div>
          </Match>
          <Match when={stripeSession()?.payment_status} keyed>
            {(paymentStatus) => (
              <Switch>
                <Match when={paymentStatus === 'unpaid'}>
                  <div class="flex gap-2 rounded-sm bg-surface-container p-2 text-sm text-on-surface">
                    <Icon name="payments" size="20" />
                    Waiting for confirmed payment...
                  </div>
                </Match>

                <Match when={paymentStatus === 'paid' && !subscription()}>
                  <div class="flex gap-2 rounded-sm bg-surface-container p-2 text-sm text-on-surface">
                    <Icon class="animate-spin" name="autorenew" size="20" />
                    Processing subscription...
                  </div>
                </Match>

                <Match when={paymentStatus === 'paid' && subscription()}>
                  <div class="flex gap-2 rounded-sm bg-tertiary-container p-2 text-sm text-on-tertiary-container">
                    <Icon name="check" size="20" />
                    <div class="flex flex-col gap-2">
                      <p class="font-semibold">comma prime activated</p>
                      <Show when={subscription()?.is_prime_sim} keyed>
                        Connectivity will be enabled as soon as activation propogates to your local cell tower. Rebooting your device may
                        help.
                      </Show>
                    </div>
                  </div>
                </Match>
              </Switch>
            )}
          </Match>
        </Switch>

        <Switch>
          <Match when={cancelData.state === 'errored'}>
            <div class="flex gap-2 rounded-sm bg-surface-container p-2 text-sm text-on-surface">
              <Icon class="text-error" name="error" size="20" />
              Failed to cancel subscription: {cancelData.error}
            </div>
          </Match>

          <Match when={cancelData.state === 'ready'}>
            <div class="flex gap-2 rounded-sm bg-surface-container p-2 text-sm text-on-surface">
              <Icon name="check" size="20" />
              Subscription cancelled
            </div>
          </Match>
        </Switch>

        <Switch>
          <Match when={subscription.state === 'errored'}>Unable to fetch subscription details: {subscription.error}</Match>
          <Match when={subscription()} keyed>
            {(subscription) => (
              <>
                <div class="flex list-none flex-col">
                  <li>Plan: {PrimePlanName[subscription.plan as PrimePlan] ?? 'unknown'}</li>
                  <li>Amount: {formatCurrency(subscription.amount)}</li>
                  <li>Joined: {formatDate(subscription.subscribed_at)}</li>
                  <li>Next payment: {formatDate(subscription.next_charge_at)}</li>
                </div>

                <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button color="error" disabled={loading()} loading={cancelData.loading} onClick={() => setCancelDialog(true)}>
                    Cancel subscription
                  </Button>
                  <Button color="secondary" disabled={loading()} loading={updateData.loading} onClick={update}>
                    Update payment method
                  </Button>
                </div>
              </>
            )}
          </Match>
        </Switch>
      </Suspense>

      <Show when={cancelDialog()}>
        <div
          class="bg-scrim/10 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setCancelDialog(false)}
        >
          <div class="flex size-full flex-col gap-4 bg-surface-container p-6 sm:h-auto sm:max-w-lg sm:rounded-lg sm:shadow-lg">
            <h2 class="text-lg">Cancel subscription</h2>
            <p class="text-sm">Are you sure you want to cancel your subscription?</p>
            <div class="mt-4 flex flex-wrap justify-stretch gap-4">
              <Button
                color="error"
                disabled={loading()}
                loading={cancelData.loading}
                onClick={() => {
                  cancel()
                  setCancelDialog(false)
                }}
              >
                Yes, cancel subscription
              </Button>
              <Button color="secondary" disabled={loading()} onClick={() => setCancelDialog(false)}>
                No, keep subscription
              </Button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}

const SimProfilesTable: VoidComponent<{ dongleId: string }> = (props) => {
  const [simData] = createResource(() => props.dongleId, describeSim)
  const [loadingProfiles, setLoadingProfiles] = createSignal<Set<string>>(new Set())
  const [error, setError] = createSignal<string | null>(null)
  const [localProfiles, setLocalProfiles] = createSignal<SimProfile[] | null>(null)
  const handleToggleProfile = async (profile: SimProfile) => {
    if (profile.enabled) return // Don't do anything if already active

    setError(null)
    setLoadingProfiles((prev) => new Set(prev).add(profile.iccid))

    try {
      const result = await setSimProfile(props.dongleId, profile.iccid)

      if (result.error) {
        setError(result.error.message)
      } else {
        // Update local state immediately to reflect the change
        const currentProfiles = simData()?.result?.profiles || []
        const updatedProfiles = currentProfiles.map((p) => ({
          ...p,
          enabled: p.iccid === profile.iccid,
        }))
        setLocalProfiles(updatedProfiles)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate profile')
    } finally {
      setLoadingProfiles((prev) => {
        const newSet = new Set(prev)
        newSet.delete(profile.iccid)
        return newSet
      })
    }
  }

  const profiles = () => localProfiles() || simData()?.result?.profiles

  const handleBootstrap = () => {
    const confirmed = confirm(
      'Are you sure you want to bootstrap the SIM card? This process is irreversible and you must buy a new comma SIM to use comma prime standard.',
    )

    if (confirmed) {
      // TODO: Implement actual bootstrap functionality
    }
  }

  return (
    <div class="flex flex-col gap-2">
      <h3 class="text-md font-medium">SIM Profiles</h3>

      <Show when={error()}>
        <div class="flex gap-2 rounded-sm bg-surface-container p-2 text-sm text-on-surface">
          <Icon class="text-error" name="error" size="20" />
          {error()}
        </div>
      </Show>

      <Suspense fallback={<div class="h-16 skeleton-loader rounded-md" />}>
        <div class="flex flex-col gap-3">
          <Show when={simData()?.result?.is_bootstrapped === false}>
            <div class="flex items-start justify-between rounded-lg border-2 border-warning bg-warning-container p-4">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <Icon name="error" class="text-warning mt-0.5" size="24" />
                <div class="flex-1 min-w-0">
                  <div class="mb-1">
                    <h4 class="text-sm font-medium text-on-warning-container">Bootstrap to setup eSIM profiles</h4>
                  </div>
                  <p class="text-xs text-on-warning-container mb-1">
                    After bootstrapping, you'll need a new comma SIM to use comma prime standard. We recommend switching to comma prime
                    lite.
                  </p>
                </div>
              </div>

              <div class="flex items-center justify-center ml-3">
                <Button color="secondary" onClick={handleBootstrap} class="h-8 px-3 text-sm">
                  Bootstrap
                </Button>
              </div>
            </div>
          </Show>

          <Show when={profiles()} keyed>
            {(profileList) => (
              <div class="grid gap-3 sm:grid-cols-2">
                <For each={profileList}>
                  {(profile) => {
                    const isLoading = () => loadingProfiles().has(profile.iccid)
                    return (
                      <div
                        class={clsx(
                          'relative rounded-lg border-2 p-4 transition-all duration-200',
                          'hover:shadow-md cursor-pointer',
                          profile.enabled
                            ? 'border-tertiary bg-tertiary-container'
                            : 'border-outline bg-surface-container hover:border-tertiary',
                          isLoading() && 'opacity-50 cursor-not-allowed',
                        )}
                        onClick={() => !profile.enabled && !isLoading() && handleToggleProfile(profile)}
                      >
                        <div class="flex items-start justify-between">
                          <div class="flex items-start gap-3 flex-1 min-w-0">
                            <Show
                              when={profile.is_comma_profile}
                              fallback={<Icon name="sim_card" size="24" class="text-on-surface-variant mt-0.5" />}
                            >
                              <img src="/images/comma-white.svg" alt="Comma logo" class="w-6 h-6 mt-0.5" />
                            </Show>
                            <div class="flex-1 min-w-0">
                              <div class="flex items-center gap-2 mb-2">
                                <h4 class="text-sm font-medium text-on-surface truncate">
                                  {profile.is_comma_profile ? 'comma' : profile.nickname}
                                </h4>
                              </div>
                              <Show when={!profile.is_comma_profile}>
                                <p class="text-xs text-on-surface-variant mb-1">{profile.provider}</p>
                              </Show>
                              <p class="text-xs font-mono text-on-surface-variant truncate">{profile.iccid}</p>
                            </div>
                          </div>

                          <div class="flex items-center justify-center ml-3">
                            <Show
                              when={!isLoading()}
                              fallback={<Icon name="autorenew" class="animate-spin text-on-surface-variant" size="20" />}
                            >
                              <button
                                class={clsx(
                                  'relative flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
                                  'focus:outline-none focus:ring-2 focus:ring-tertiary focus:ring-offset-2',
                                  profile.enabled ? 'border-tertiary bg-tertiary' : 'border-outline hover:border-tertiary',
                                )}
                                disabled={profile.enabled}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleProfile(profile)
                                }}
                              >
                                {profile.enabled && <div class="h-2 w-2 rounded-full bg-on-tertiary" />}
                              </button>
                            </Show>
                          </div>
                        </div>
                      </div>
                    )
                  }}
                </For>
              </div>
            )}
          </Show>
        </div>
        <Show when={simData.error || error() || simData()?.error}>
          <Show
            when={error()?.includes('Method not found') || simData()?.error?.message?.includes('Method not found')}
            fallback={
              <div class="flex gap-2 rounded-sm bg-surface-container p-2 text-sm text-on-surface">
                <Icon class="text-error" name="error" size="20" />
                Failed to load SIM profiles: {simData.error || error()}
              </div>
            }
          >
            <div class="flex items-start justify-between rounded-lg border-2 border-warning bg-warning-container p-4">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <Icon name="error" class="text-warning mt-0.5" size="24" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-2">
                    <h4 class="text-sm font-medium text-on-warning-container">Update Required</h4>
                  </div>
                  <p class="text-xs text-on-warning-container mb-1">
                    You must update your openpilot version to manage SIM profiles. Your current version doesn't support this feature.
                  </p>
                </div>
              </div>
            </div>
          </Show>
        </Show>
      </Suspense>
    </div>
  )
}

const DeviceSettingsForm: VoidComponent<{ dongleId: string; device: Resource<Device> }> = (props) => {
  const [deviceName] = createResource(props.device, getDeviceName)

  const [unpair, unpairData] = useAction(async () => {
    const { success } = await unpairDevice(props.dongleId)
    if (success) window.location.href = window.location.origin
  })

  return (
    <div class="flex flex-col gap-4">
      <div class="flex justify-between">
        <h2 class="text-lg">{deviceName()}</h2>
        <Button color="error" leading={<Icon name="delete" />} onClick={unpair} disabled={unpairData.loading}>
          Unpair this device
        </Button>
      </div>

      <SimProfilesTable dongleId={props.dongleId} />

      <Show when={unpairData.error}>
        <div class="flex gap-2 rounded-sm bg-surface-container-high p-2 text-sm text-on-surface">
          <Icon class="text-error" name="error" size="20" />
          {unpairData.error?.message ?? unpairData.error?.cause ?? unpairData.error ?? 'Unknown error'}
        </div>
      </Show>
    </div>
  )
}

const SettingsActivity: VoidComponent<PrimeActivityProps> = (props) => {
  const [device] = createResource(() => props.dongleId, getDevice)

  const { modal } = useDrawerContext()

  return (
    <>
      <div class={clsx('flex flex-col gap-4 px-4', modal() ? 'mt-20' : 'mt-4')}>
        <DeviceSettingsForm dongleId={props.dongleId} device={device} />
        <hr class="mx-4 opacity-20" />
        <h2 class="text-lg">comma prime</h2>
        <Suspense fallback={<div class="h-64 skeleton-loader rounded-md" />}>
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
