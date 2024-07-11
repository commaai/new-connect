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

interface SubscribeInfo {
  data_connected: boolean | null
  device_online: boolean
  has_prime: boolean
  is_prime_sim: boolean
  sim_id: string | null
  sim_type: string | null
  sim_usable: boolean | null
  trial_end_data: number | null,
  trial_end_nodata: number | null,
}

export const getSubscribeInfo = async (dongleId: string) => {
  const params = new URLSearchParams()
  params.append('dongle_id', dongleId)
  return fetcher<SubscribeInfo>(`/v1/prime/subscribe_info?${params.toString()}`, undefined, BILLING_URL)
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
