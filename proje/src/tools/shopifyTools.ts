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
    console.log('[API] ❌ API_URL is not set')
    return { success: false, error: 'API_URL is not set.' }
  }

  console.log('═══════════════════════════════════════════════════════════')
  console.log('[API] 📤 REQUEST')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('[API] URL:', url)
  console.log('[API] Method: POST')
  console.log('[API] Headers:', JSON.stringify({ 'Content-Type': 'application/json' }))
  console.log('[API] Body:')
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
    console.log('[API] 📥 RESPONSE')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('[API] Status:', response.status, response.statusText)
    console.log('[API] Duration:', duration, 'ms')
    console.log('[API] Response Headers:')
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`)
    })
    
    const rawText = await response.text()
    console.log('[API] Raw Response Body:')
    console.log(rawText)
    console.log('═══════════════════════════════════════════════════════════')
    
    let payload: unknown
    try {
      payload = JSON.parse(rawText)
    } catch {
      console.log('[API] ❌ Failed to parse JSON response')
      return { success: false, error: 'Invalid JSON response.' }
    }
    
    console.log('[API] Parsed JSON:')
    console.log(JSON.stringify(payload, null, 2))
    console.log('═══════════════════════════════════════════════════════════')

    if (!payload || typeof payload !== 'object') {
      console.log('[API] ❌ Payload is not an object')
      return { success: false, error: 'Invalid JSON response.' }
    }

    const p = payload as Record<string, unknown>

    // Check for success: true
    if (p.success === true) {
      console.log('[API] ✅ Success response detected')
      return payload as ApiSuccess<TData>
    }

    // Check for success: false with error
    if (p.success === false && typeof p.error === 'string') {
      console.log('[API] ❌ Error response:', p.error)
      return payload as ApiError
    }

    // If API doesn't use success field but returns data directly
    // Treat any non-error response as success
    if (!('success' in p) && !('error' in p)) {
      console.log('[API] ⚠️ No success field - treating as success with data')
      return { success: true, data: payload as TData }
    }
    
    // If there's an error field without success field
    if ('error' in p && typeof p.error === 'string') {
      console.log('[API] ❌ Error field found:', p.error)
      return { success: false, error: p.error }
    }

    console.log('[API] ❌ Unexpected response shape - payload keys:', Object.keys(p))
    return { success: false, error: `Unexpected response shape: ${JSON.stringify(p).substring(0, 200)}` }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed.'
    console.log('[API] ❌ Request error:', message)
    return { success: false, error: message }
  }
}

// Tool 1: shopify_add_tags
export type ShopifyAddTagsParams = {
  id: string
  tags: string[]
}

export const shopifyAddTags = (params: ShopifyAddTagsParams) =>
  postJson<ShopifyAddTagsParams, void>('/hackathon/add_tags', params)

// Tool 2: shopify_cancel_order
export type ShopifyCancelOrderParams = {
  orderId: string
  reason: 'CUSTOMER' | 'DECLINED' | 'FRAUD' | 'INVENTORY' | 'OTHER' | 'STAFF'
  notifyCustomer: boolean
  restock: boolean
  staffNote: string
  refundMode: 'ORIGINAL' | 'STORE_CREDIT'
  storeCredit: {
    expiresAt: string | null
  }
}

export const shopifyCancelOrder = (params: ShopifyCancelOrderParams) =>
  postJson<ShopifyCancelOrderParams, void>('/hackathon/cancel_order', params)

// Tool 3: shopify_create_discount_code
export type ShopifyCreateDiscountCodeParams = {
  type: 'percentage' | 'fixed'
  value: number
  duration: number
  productIds: string[]
}

export type ShopifyCreateDiscountCodeData = {
  code: string
}

export const shopifyCreateDiscountCode = (
  params: ShopifyCreateDiscountCodeParams
) =>
  postJson<ShopifyCreateDiscountCodeParams, ShopifyCreateDiscountCodeData>(
    '/hackathon/create_discount_code',
    params
  )

// Tool 4: shopify_create_return
export type ShopifyCreateReturnParams = {
  orderId: string
}

export const shopifyCreateReturn = (params: ShopifyCreateReturnParams) =>
  postJson<ShopifyCreateReturnParams, void>('/hackathon/create_return', params)

// Tool 5: shopify_create_store_credit
export type ShopifyCreateStoreCreditParams = {
  id: string
  creditAmount: {
    amount: string
    currencyCode: string
  }
  expiresAt: string | null
}

export type ShopifyCreateStoreCreditData = {
  storeCreditAccountId: string
  credited: {
    amount: string
    currencyCode: string
  }
  newBalance: {
    amount: string
    currencyCode: string
  }
}

export const shopifyCreateStoreCredit = (
  params: ShopifyCreateStoreCreditParams
) =>
  postJson<ShopifyCreateStoreCreditParams, ShopifyCreateStoreCreditData>(
    '/hackathon/create_store_credit',
    params
  )

// Tool 6: shopify_get_collection_recommendations
export type ShopifyGetCollectionRecommendationsParams = {
  queryKeys: string[]
}

export type ShopifyCollectionRecommendation = {
  id: string
  title: string
  handle: string
}

export const shopifyGetCollectionRecommendations = (
  params: ShopifyGetCollectionRecommendationsParams
) =>
  postJson<
    ShopifyGetCollectionRecommendationsParams,
    ShopifyCollectionRecommendation[]
  >('/hackathon/get_collection_recommendations', params)

// Tool 7: shopify_get_customer_orders
export type ShopifyGetCustomerOrdersParams = {
  email: string
  after: string | null
  limit: number
}

export type ShopifyOrderStatus =
  | 'FULFILLED'
  | 'UNFULFILLED'
  | 'CANCELLED'
  | 'DELIVERED'

export type ShopifyOrderSummary = {
  id: string
  name: string
  createdAt: string
  status: ShopifyOrderStatus
  trackingUrl: string
}

export type ShopifyGetCustomerOrdersData = {
  orders: ShopifyOrderSummary[]
  hasNextPage: boolean
  endCursor: string | null
}

export const shopifyGetCustomerOrders = (
  params: ShopifyGetCustomerOrdersParams
) =>
  postJson<ShopifyGetCustomerOrdersParams, ShopifyGetCustomerOrdersData>(
    '/hackathon/get_customer_orders',
    params
  )

// Tool 8: shopify_get_order_details
export type ShopifyGetOrderDetailsParams = {
  orderId: string
}

export type ShopifyOrderDetails = {
  id: string
  name: string
  createdAt: string
  status: ShopifyOrderStatus
  trackingUrl: string
}

export const shopifyGetOrderDetails = (params: ShopifyGetOrderDetailsParams) =>
  postJson<ShopifyGetOrderDetailsParams, ShopifyOrderDetails>(
    '/hackathon/get_order_details',
    params
  )

// Tool 9: shopify_get_product_details
export type ShopifyGetProductDetailsParams = {
  queryType: 'id' | 'name' | 'key feature'
  queryKey: string
}

export type ShopifyProductSummary = {
  id: string
  title: string
  handle: string
}

export const shopifyGetProductDetails = (
  params: ShopifyGetProductDetailsParams
) =>
  postJson<ShopifyGetProductDetailsParams, ShopifyProductSummary[]>(
    '/hackathon/get_product_details',
    params
  )

// Tool 10: shopify_get_product_recommendations
export type ShopifyGetProductRecommendationsParams = {
  queryKeys: string[]
}

export const shopifyGetProductRecommendations = (
  params: ShopifyGetProductRecommendationsParams
) =>
  postJson<ShopifyGetProductRecommendationsParams, ShopifyProductSummary[]>(
    '/hackathon/get_product_recommendations',
    params
  )

// Tool 11: shopify_get_related_knowledge_source
export type ShopifyKnowledgeSourceItem = Record<string, unknown>

export type ShopifyGetRelatedKnowledgeSourceParams = {
  question: string
  specificToProductId: string | null
}

export type ShopifyGetRelatedKnowledgeSourceData = {
  faqs: ShopifyKnowledgeSourceItem[]
  pdfs: ShopifyKnowledgeSourceItem[]
  blogArticles: ShopifyKnowledgeSourceItem[]
  pages: ShopifyKnowledgeSourceItem[]
}

export const shopifyGetRelatedKnowledgeSource = (
  params: ShopifyGetRelatedKnowledgeSourceParams
) =>
  postJson<
    ShopifyGetRelatedKnowledgeSourceParams,
    ShopifyGetRelatedKnowledgeSourceData
  >('/hackathon/get_related_knowledge_source', params)

// Tool 12: shopify_refund_order
export type ShopifyRefundOrderParams = {
  orderId: string
  refundMethod: 'ORIGINAL_PAYMENT_METHODS' | 'STORE_CREDIT'
}

export const shopifyRefundOrder = (params: ShopifyRefundOrderParams) =>
  postJson<ShopifyRefundOrderParams, void>('/hackathon/refund_order', params)

// Tool 13: shopify_update_order_shipping_address
export type ShopifyShippingAddress = {
  firstName: string
  lastName: string
  company: string
  address1: string
  address2: string
  city: string
  provinceCode: string
  country: string
  zip: string
  phone: string
}

export type ShopifyUpdateOrderShippingAddressParams = {
  orderId: string
  shippingAddress: ShopifyShippingAddress
}

export const shopifyUpdateOrderShippingAddress = (
  params: ShopifyUpdateOrderShippingAddressParams
) =>
  postJson<ShopifyUpdateOrderShippingAddressParams, void>(
    '/hackathon/update_order_shipping_address',
    params
  )
