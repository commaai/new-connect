import { BILLING_URL } from './config'

import { fetcher } from '.'

export interface SubscriptionStatus {
  amount: number
  cancel_at: number | null
  is_prime_sim: boolean
  next_charge_at: number
  plan: string
  requires_migration: boolean
  sim_id: string | null
  subscribed_at: number
  // trial_claim_end: number | null
  // trial_claimable: boolean
  trial_end: number
  user_id: string
}

export const getSubscriptionStatus = async (dongleId: string) => {
  const params = new URLSearchParams()
  params.append('dongle_id', dongleId)
  return fetcher<SubscriptionStatus>(`/v1/prime/subscription?${params.toString()}`, undefined, BILLING_URL)
}

export interface SubscribeInfo {
  data_connected: boolean | null
  device_online: boolean
  has_prime: boolean
  is_prime_sim: boolean
  sim_id: string | null
  sim_type: string | null
  sim_usable: boolean | null
  trial_end_data: number | null
  trial_end_nodata: number | null
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

const getBilling = <T>(endpoint: string, init?: RequestInit): Promise<T> => fetcher<T>(endpoint, init, BILLING_URL)

const postBilling = <T>(endpoint: string, body: unknown, init?: RequestInit): Promise<T> => {
  return fetcher(
    endpoint,
    {
      ...init,
      method: 'POST',
      headers: {
        ...init?.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    BILLING_URL,
  )
}

export const activateSubscription = async (body: ActivateSubscriptionRequest) =>
  postBilling<{ success: 1 }>('/v1/prime/pay', body)

export const cancelSubscription = async (dongleId: string) =>
  postBilling<{ success: 1 }>('/v1/prime/cancel', { dongle_id: dongleId })

interface PaymentSource {
  brand: string
  country: string
  exp_month: number
  exp_year: number
  last4: string
  tokenization_method: string | null
}

export const getPaymentSource = async () => getBilling<PaymentSource>('/v1/prime/payment_source')

export const setPaymentSource = async (stripeToken: string) =>
  postBilling<PaymentSource>('/v1/prime/payment_source', { stripe_token: stripeToken })

export const getStripeCheckout = async (dongleId: string, simId: string, plan: string) =>
  postBilling<{ url: string }>('/v1/prime/stripe_checkout', {
    dongle_id: dongleId,
    sim_id: simId,
    plan,
  })

export const getStripePortal = async (dongleId: string) =>
  getBilling<{ url: string }>(`/v1/prime/stripe_portal?dongle_id=${dongleId}`)

export const getStripeSession = async (dongleId: string, sessionId: string) =>
  getBilling<{ payment_status: 'no_payment_required' | 'paid' | 'unpaid' }>(
    `/v1/prime/stripe_session?dongle_id=${dongleId}&session_id=${sessionId}`,
  )
