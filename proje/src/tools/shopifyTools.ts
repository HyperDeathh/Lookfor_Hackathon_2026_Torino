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

export type ShopifyAddTagsParams = {
  id: string
  tags: string[]
}

export const shopifyAddTags = (params: ShopifyAddTagsParams) =>
  postJson<ShopifyAddTagsParams, void>('/hackhaton/add_tags', params)

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
  postJson<ShopifyCancelOrderParams, void>('/hackhaton/cancel_order', params)

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
    '/hackhaton/create_discount_code',
    params
  )

export type ShopifyDraftOrderLineItem = {
  variantId: string
  quantity: number
}

export type ShopifyDraftOrderShippingAddress = {
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

export type ShopifyCreateDraftOrderParams = {
  customerId: string
  lineItems: ShopifyDraftOrderLineItem[]
  shippingAddress?: ShopifyDraftOrderShippingAddress
  note?: string
}

export type ShopifyCreateDraftOrderData = {
  draftOrderId: string
  invoiceUrl?: string
}

export const shopifyCreateDraftOrder = (
  params: ShopifyCreateDraftOrderParams
) =>
  postJson<ShopifyCreateDraftOrderParams, ShopifyCreateDraftOrderData>(
    '/hackhaton/create_draft_order',
    params
  )

export type ShopifyCreateReturnParams = {
  orderId: string
}

export const shopifyCreateReturn = (params: ShopifyCreateReturnParams) =>
  postJson<ShopifyCreateReturnParams, void>('/hackhaton/create_return', params)

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
    '/hackhaton/create_store_credit',
    params
  )

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
  >('/hackhaton/get_collection_recommendations', params)

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
    '/hackhaton/get_customer_orders',
    params
  )

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
    '/hackhaton/get_order_details',
    params
  )

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
    '/hackhaton/get_product_details',
    params
  )

export type ShopifyGetProductRecommendationsParams = {
  queryKeys: string[]
}

export const shopifyGetProductRecommendations = (
  params: ShopifyGetProductRecommendationsParams
) =>
  postJson<ShopifyGetProductRecommendationsParams, ShopifyProductSummary[]>(
    '/hackhaton/get_product_recommendations',
    params
  )

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
  >('/hackhaton/get_related_knowledge_source', params)

export type ShopifyRefundOrderParams = {
  orderId: string
  refundMethod: 'ORIGINAL_PAYMENT_METHODS' | 'STORE_CREDIT'
}

export const shopifyRefundOrder = (params: ShopifyRefundOrderParams) =>
  postJson<ShopifyRefundOrderParams, void>('/hackhaton/refund_order', params)

export type ShopifyUpdateOrderShippingAddressParams = {
  orderId: string
  shippingAddress: ShopifyDraftOrderShippingAddress
}

export const shopifyUpdateOrderShippingAddress = (
  params: ShopifyUpdateOrderShippingAddressParams
) =>
  postJson<ShopifyUpdateOrderShippingAddressParams, void>(
    '/hackhaton/update_order_shipping_address',
    params
  )
