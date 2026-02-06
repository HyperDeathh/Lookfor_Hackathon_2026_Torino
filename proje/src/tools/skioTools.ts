type ApiSuccess<T> = {
  success: true
  data?: T
}

type ApiError = {
  success: false
  error: string
}

export type ApiResult<T> = ApiSuccess<T> | ApiError

const resolveUrl = (path: string): string | null => {
  const baseUrl = process.env.API_URL
  if (!baseUrl) {
    return null
  }

  const normalizedBase = baseUrl.replace(/\/+$/, '')
  return `${normalizedBase}${path}`
}

const postJson = async <TParams, TData>(
  path: string,
  params: TParams
): Promise<ApiResult<TData>> => {
  const url = resolveUrl(path)
  if (!url) {
    return { success: false, error: 'API_URL is not set.' }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })

    const payload = await response.json().catch(() => null)
    if (!payload || typeof payload !== 'object') {
      return { success: false, error: 'Invalid JSON response.' }
    }

    if (payload.success === true) {
      return payload as ApiSuccess<TData>
    }

    if (payload.success === false && typeof payload.error === 'string') {
      return payload as ApiError
    }

    return { success: false, error: 'Unexpected response shape.' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed.'
    return { success: false, error: message }
  }
}

export type SkioCancelSubscriptionParams = {
  subscriptionId: string
  cancellationReasons: string[]
}

export const skioCancelSubscription = (params: SkioCancelSubscriptionParams) =>
  postJson<SkioCancelSubscriptionParams, void>(
    '/hackhaton/cancel-subscription',
    params
  )

export type SkioGetSubscriptionStatusParams = {
  email: string
}

export type SkioGetSubscriptionStatusData = {
  status: string
  subscriptionId: string
  nextBillingDate: string
}

export const skioGetSubscriptionStatus = (
  params: SkioGetSubscriptionStatusParams
) =>
  postJson<SkioGetSubscriptionStatusParams, SkioGetSubscriptionStatusData>(
    '/hackhaton/get-subscription-status',
    params
  )

export type SkioPauseSubscriptionParams = {
  subscriptionId: string
  pausedUntil: string
}

export const skioPauseSubscription = (params: SkioPauseSubscriptionParams) =>
  postJson<SkioPauseSubscriptionParams, void>(
    '/hackhaton/pause-subscription',
    params
  )

export type SkioSkipNextOrderSubscriptionParams = {
  subscriptionId: string
}

export const skioSkipNextOrderSubscription = (
  params: SkioSkipNextOrderSubscriptionParams
) =>
  postJson<SkioSkipNextOrderSubscriptionParams, void>(
    '/hackhaton/skip-next-order-subscription',
    params
  )

export type SkioUnpauseSubscriptionParams = {
  subscriptionId: string
}

export const skioUnpauseSubscription = (
  params: SkioUnpauseSubscriptionParams
) =>
  postJson<SkioUnpauseSubscriptionParams, void>(
    '/hackhaton/unpause-subscription',
    params
  )
