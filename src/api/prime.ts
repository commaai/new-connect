import { BILLING_URL } from './config'

import { fetcher } from '.'

interface SubscriptionStatus {
  amount: number
  is_prime_sim: boolean
  next_charge_at: number
  sim_id: string | null
  subscribed_at: number
  trial_claim_end: number | null
  trial_claimable: boolean
  trial_end: number
  user_id: string
}

export const getSubscriptionStatus = async (dongleId: string) => {
  const params = new URLSearchParams()
  params.append('dongle_id', dongleId)
  return fetcher<SubscriptionStatus>(`/v1/prime/subscription?${params.toString()}`, undefined, BILLING_URL)
}

interface ActivateSubscriptionRequest {
  dongle_id: string
  sim_id: string | null
  stripe_token: string
}

export const activateSubscription = async (body: ActivateSubscriptionRequest) =>
  fetcher('/v1/prime/pay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }, BILLING_URL)

export const cancelSubscription = async (dongleId: string) =>
  fetcher('/v1/prime/cancel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dongle_id: dongleId,
    }),
  }, BILLING_URL)
