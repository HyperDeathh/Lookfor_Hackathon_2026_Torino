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
    console.log('[SKIO API] ❌ API_URL is not set')
    return { success: false, error: 'API_URL is not set.' }
  }

  console.log('═══════════════════════════════════════════════════════════')
  console.log('[SKIO API] 📤 REQUEST')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('[SKIO API] URL:', url)
  console.log('[SKIO API] Method: POST')
  console.log('[SKIO API] Headers:', JSON.stringify({ 'Content-Type': 'application/json' }))
  console.log('[SKIO API] Body:')
  console.log(JSON.stringify(params, null, 2))
  console.log('═══════════════════════════════════════════════════════════')

  try {
    const startTime = Date.now()
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
    const duration = Date.now() - startTime

    console.log('═══════════════════════════════════════════════════════════')
    console.log('[SKIO API] 📥 RESPONSE')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('[SKIO API] Status:', response.status, response.statusText)
    console.log('[SKIO API] Duration:', duration, 'ms')
    console.log('[SKIO API] Response Headers:')
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`)
    })
    
    const rawText = await response.text()
    console.log('[SKIO API] Raw Response Body:')
    console.log(rawText)
    console.log('═══════════════════════════════════════════════════════════')
    
    let payload: unknown
    try {
      payload = JSON.parse(rawText)
    } catch {
      console.log('[SKIO API] ❌ Failed to parse JSON response')
      return { success: false, error: 'Invalid JSON response.' }
    }
    
    console.log('[SKIO API] Parsed JSON:')
    console.log(JSON.stringify(payload, null, 2))
    console.log('═══════════════════════════════════════════════════════════')

    if (!payload || typeof payload !== 'object') {
      console.log('[SKIO API] ❌ Payload is not an object')
      return { success: false, error: 'Invalid JSON response.' }
    }

    const p = payload as Record<string, unknown>

    if (p.success === true) {
      console.log('[SKIO API] ✅ Success response detected')
      return payload as ApiSuccess<TData>
    }

    if (p.success === false && typeof p.error === 'string') {
      console.log('[SKIO API] ❌ Error response:', p.error)
      return payload as ApiError
    }

    if (!('success' in p) && !('error' in p)) {
      console.log('[SKIO API] ⚠️ No success field - treating as success with data')
      return { success: true, data: payload as TData }
    }
    
    if ('error' in p && typeof p.error === 'string') {
      console.log('[SKIO API] ❌ Error field found:', p.error)
      return { success: false, error: p.error }
    }

    console.log('[SKIO API] ❌ Unexpected response shape - payload keys:', Object.keys(p))
    return { success: false, error: `Unexpected response shape: ${JSON.stringify(p).substring(0, 200)}` }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed.'
    console.log('[SKIO API] ❌ Request error:', message)
    return { success: false, error: message }
  }
}

// Tool 14: skio_cancel_subscription
export type SkioCancelSubscriptionParams = {
  subscriptionId: string
  cancellationReasons: string[]
}

export const skioCancelSubscription = (params: SkioCancelSubscriptionParams) =>
  postJson<SkioCancelSubscriptionParams, void>(
    '/hackathon/cancel-subscription',
    params
  )

// Tool 15: skio_get_subscriptions
export type SkioGetSubscriptionsParams = {
  email: string
}

export type SkioSubscription = {
  status: string
  subscriptionId: string
  nextBillingDate: string | null
}

export const skioGetSubscriptions = (
  params: SkioGetSubscriptionsParams
) =>
  postJson<SkioGetSubscriptionsParams, SkioSubscription[]>(
    '/hackathon/get-subscriptions',
    params
  )

// Tool 16: skio_pause_subscription
export type SkioPauseSubscriptionParams = {
  subscriptionId: string
  pausedUntil: string
}

export const skioPauseSubscription = (params: SkioPauseSubscriptionParams) =>
  postJson<SkioPauseSubscriptionParams, void>(
    '/hackathon/pause-subscription',
    params
  )

// Tool 17: skio_skip_next_order_subscription
export type SkioSkipNextOrderSubscriptionParams = {
  subscriptionId: string
}

export const skioSkipNextOrderSubscription = (
  params: SkioSkipNextOrderSubscriptionParams
) =>
  postJson<SkioSkipNextOrderSubscriptionParams, void>(
    '/hackathon/skip-next-order-subscription',
    params
  )

// Tool 18: skio_unpause_subscription
export type SkioUnpauseSubscriptionParams = {
  subscriptionId: string
}

export const skioUnpauseSubscription = (
  params: SkioUnpauseSubscriptionParams
) =>
  postJson<SkioUnpauseSubscriptionParams, void>(
    '/hackathon/unpause-subscription',
    params
  )
