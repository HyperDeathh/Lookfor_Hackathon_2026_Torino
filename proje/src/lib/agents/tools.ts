import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import {
  shopifyGetOrderDetails,
  shopifyGetCustomerOrders,
  shopifyUpdateOrderShippingAddress,
  shopifyCancelOrder,
  shopifyCreateStoreCredit,
  shopifyRefundOrder,
  shopifyCreateReturn,
  shopifyAddTags,
  shopifyCreateDiscountCode,
  shopifyGetCollectionRecommendations,
  shopifyGetProductDetails,
  shopifyGetProductRecommendations,
  shopifyGetRelatedKnowledgeSource
} from '../../tools/shopifyTools'
import {
  skioGetSubscriptionStatus,
  skioSkipNextOrderSubscription,
  skioPauseSubscription,
  skioUnpauseSubscription,
  skioCancelSubscription
} from '../../tools/skioTools'

// --- Order Management Tools ---

export const shopify_get_order_details = tool(
  async input => {
    return await shopifyGetOrderDetails(input)
  },
  {
    name: 'shopify_get_order_details',
    description: 'Get details of a specific order by ID',
    schema: z.object({
      orderId: z.string()
    })
  }
)

export const shopify_get_customer_orders = tool(
  async input => {
    return await shopifyGetCustomerOrders({
      email: input.email,
      after: input.after || null,
      limit: input.limit || 5
    })
  },
  {
    name: 'shopify_get_customer_orders',
    description: 'Get list of recent orders for a customer email',
    schema: z.object({
      email: z.string().describe('Customer email.'),
      after: z.string().nullable().optional().describe('Cursor to start from, "null" if first page'),
      limit: z.number().optional().describe('Number of orders to return, max 250')
    })
  }
)

export const shopify_update_order_shipping_address = tool(
  async input => {
    return await shopifyUpdateOrderShippingAddress({
      orderId: input.orderId,
      shippingAddress: {
        address1: input.shippingAddress.address1,
        city: input.shippingAddress.city,
        zip: input.shippingAddress.zip,
        country: input.shippingAddress.country,
        // The following fields are optional in the Zod schema,
        // but can be undefined in the tool call if not provided.
        // We pass them only if they exist.
        ...(input.shippingAddress.firstName
          ? { firstName: input.shippingAddress.firstName }
          : {}),
        ...(input.shippingAddress.lastName
          ? { lastName: input.shippingAddress.lastName }
          : {}),
        ...(input.shippingAddress.company
          ? { company: input.shippingAddress.company }
          : {}),
        ...(input.shippingAddress.address2
          ? { address2: input.shippingAddress.address2 }
          : {}),
        ...(input.shippingAddress.provinceCode
          ? { provinceCode: input.shippingAddress.provinceCode }
          : {}),
        ...(input.shippingAddress.phone
          ? { phone: input.shippingAddress.phone }
          : {})
      }
    })
  },
  {
    name: 'shopify_update_order_shipping_address',
    description: 'Update the shipping address for an unfulfilled order',
    schema: z.object({
      orderId: z.string(),
      shippingAddress: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        company: z.string().optional(),
        address1: z.string(),
        address2: z.string().optional(),
        city: z.string(),
        provinceCode: z.string().optional(),
        country: z.string(),
        zip: z.string(),
        phone: z.string().optional()
      })
    })
  }
)

export const shopify_cancel_order = tool(
  async input => {
    return await shopifyCancelOrder({
      orderId: input.orderId,
      reason: input.reason,
      notifyCustomer: input.notifyCustomer ?? true,
      restock: input.restock ?? true,
      staffNote: input.staffNote || 'Cancelled by AI Agent',
      refundMode: input.refundMode || 'ORIGINAL',
      storeCredit: input.storeCredit || { expiresAt: null }
    })
  },
  {
    name: 'shopify_cancel_order',
    description: 'Cancel an order based on order ID and reason.',
    schema: z.object({
      orderId: z.string().describe('Order GID.'),
      reason: z.enum(['CUSTOMER', 'DECLINED', 'FRAUD', 'INVENTORY', 'OTHER', 'STAFF']).describe('Cancellation reason.'),
      notifyCustomer: z.boolean().optional().default(true).describe('Notify customer.'),
      restock: z.boolean().optional().default(true).describe('Restock inventory where applicable.'),
      staffNote: z.string().optional().describe('Internal note.'),
      refundMode: z.enum(['ORIGINAL', 'STORE_CREDIT']).optional().default('ORIGINAL').describe('Refund method.'),
      storeCredit: z.object({
        expiresAt: z.string().nullable().describe('ISO 8601 timestamp or null for no expiry.')
      }).optional().describe('Store credit options (only when refundMode=STORE_CREDIT).')
    })
  }
)

// --- Escalation Tool (REQUIRED BY HACKATHON) ---

export const escalate_to_human = tool(
  async input => {
    // This tool doesn't call an external API - it returns structured data
    // that the system uses to stop automation and notify the team
    const summary = {
      reason: input.reason,
      customerMessage: input.customerMessage,
      internalSummary: input.internalSummary,
      suggestedAction: input.suggestedAction,
      escalatedAt: new Date().toISOString()
    }
    console.log('[ESCALATION] Ticket escalated to human:', summary)
    return JSON.stringify({
      success: true,
      data: summary
    })
  },
  {
    name: 'escalate_to_human',
    description: 'Escalate the conversation to a human agent. Use this when you cannot safely proceed, when the workflow manual requires escalation, or when the customer explicitly requests to speak with a human. IMPORTANT: After calling this tool, you MUST stop generating automatic replies.',
    schema: z.object({
      reason: z.enum([
        'CUSTOMER_REQUEST',
        'POLICY_VIOLATION',
        'COMPLEX_ISSUE',
        'TECHNICAL_ERROR',
        'SAFETY_CONCERN',
        'WORKFLOW_REQUIRED',
        'ORDER_NOT_FOUND',
        'SUBSCRIPTION_NOT_FOUND',
        'DATA_MISMATCH',
        'REFUND_LIMIT_EXCEEDED',
        'FRAUD_SUSPECTED',
        'OTHER'
      ]).describe('Why escalation is needed.'),
      customerMessage: z.string().describe('A polite message to send to the customer informing them of the escalation.'),
      internalSummary: z.string().describe('A structured summary for the support team including: issue type, actions taken, customer sentiment, and recommended next steps.'),
      suggestedAction: z.string().optional().describe('What the human agent should do next.')
    })
  }
)

// --- Resolution & Refund Tools ---

export const shopify_create_store_credit = tool(
  async input => {
    return await shopifyCreateStoreCredit({
      id: input.id,
      creditAmount: input.creditAmount,
      expiresAt: input.expiresAt || null
    })
  },
  {
    name: 'shopify_create_store_credit',
    description: 'Credit store credit to a customer or StoreCreditAccount.',
    schema: z.object({
      id: z.string().describe('Customer GID or StoreCreditAccount GID.'),
      creditAmount: z.object({
        amount: z.string().describe('Decimal amount, e.g. "49.99".'),
        currencyCode: z.string().describe('ISO 4217 code, e.g. USD, EUR.')
      }),
      expiresAt: z.string().nullable().optional().describe('Optional ISO8601 expiry (or null).')
    })
  }
)

export const shopify_refund_order = tool(
  async input => {
    return await shopifyRefundOrder({
      orderId: input.orderId,
      refundMethod: input.refundMethod
    })
  },
  {
    name: 'shopify_refund_order',
    description: 'Refund an order to original payment method or store credit',
    schema: z.object({
      orderId: z.string(),
      refundMethod: z.enum(['ORIGINAL_PAYMENT_METHODS', 'STORE_CREDIT'])
    })
  }
)

export const shopify_create_return = tool(
  async input => {
    return await shopifyCreateReturn(input)
  },
  {
    name: 'shopify_create_return',
    description: 'Initiate a return process for an order',
    schema: z.object({
      orderId: z.string()
    })
  }
)

export const shopify_add_tags = tool(
  async input => {
    return await shopifyAddTags(input)
  },
  {
    name: 'shopify_add_tags',
    description: 'Add monitoring tags to an order or customer',
    schema: z.object({
      id: z.string(),
      tags: z.array(z.string())
    })
  }
)

// --- Subscription Tools ---

export const skio_get_subscription_status = tool(
  async input => {
    return await skioGetSubscriptionStatus(input)
  },
  {
    name: 'skio_get_subscription_status',
    description: 'Check status of a subscription',
    schema: z.object({
      email: z.string()
    })
  }
)

export const skio_skip_next_order_subscription = tool(
  async input => {
    return await skioSkipNextOrderSubscription(input)
  },
  {
    name: 'skio_skip_next_order_subscription',
    description: 'Skip the immediate next order in subscription',
    schema: z.object({
      subscriptionId: z.string()
    })
  }
)

export const skio_pause_subscription = tool(
  async input => {
    return await skioPauseSubscription(input)
  },
  {
    name: 'skio_pause_subscription',
    description: 'Pause subscription until date',
    schema: z.object({
      subscriptionId: z.string(),
      pausedUntil: z.string()
    })
  }
)

export const skio_cancel_subscription = tool(
  async input => {
    return await skioCancelSubscription(input)
  },
  {
    name: 'skio_cancel_subscription',
    description: 'Cancel subscription permanently',
    schema: z.object({
      subscriptionId: z.string(),
      cancellationReasons: z.array(z.string())
    })
  }
)

export const skio_unpause_subscription = tool(
  async input => {
    return await skioUnpauseSubscription({
      subscriptionId: input.subscriptionId
    })
  },
  {
    name: 'skio_unpause_subscription',
    description: 'Unpause a paused subscription',
    schema: z.object({
      subscriptionId: z.string()
    })
  }
)

export const shopify_create_discount_code = tool(
  async input => {
    return await shopifyCreateDiscountCode({
      type: input.type,
      value: input.value,
      duration: input.duration,
      productIds: input.productIds || []
    })
  },
  {
    name: 'shopify_create_discount_code',
    description: 'Create a discount code',
    schema: z.object({
      type: z.enum(['percentage', 'fixed']),
      value: z.number(),
      duration: z.number(),
      productIds: z.array(z.string()).nullable().optional()
    })
  }
)

// --- Sales & Product Tools ---

export const shopify_get_product_details = tool(
  async input => {
    return await shopifyGetProductDetails(input)
  },
  {
    name: 'shopify_get_product_details',
    description: 'Get product specs and details',
    schema: z.object({
      queryType: z.enum(['id', 'name', 'key feature']),
      queryKey: z.string()
    })
  }
)

export const shopify_get_product_recommendations = tool(
  async input => {
    return await shopifyGetProductRecommendations(input)
  },
  {
    name: 'shopify_get_product_recommendations',
    description: 'Get product recommendations based on keywords',
    schema: z.object({
      queryKeys: z.array(z.string())
    })
  }
)

export const shopify_get_collection_recommendations = tool(
  async input => {
    return await shopifyGetCollectionRecommendations({
      queryKeys: input.queryKeys
    })
  },
  {
    name: 'shopify_get_collection_recommendations',
    description: 'Get collection recommendations based on keywords',
    schema: z.object({
      queryKeys: z.array(z.string())
    })
  }
)

export const shopify_get_related_knowledge_source = tool(
  async input => {
    return await shopifyGetRelatedKnowledgeSource({
      question: input.question,
      specificToProductId: input.specificToProductId || null
    })
  },
  {
    name: 'shopify_get_related_knowledge_source',
    description: 'Search FAQs, Blogs, and Docs to answer questions',
    schema: z.object({
      question: z.string(),
      specificToProductId: z.string().nullable().optional()
    })
  }
)

// Export all tools as a list for the ToolNode
export const ALL_TOOLS = [
  // Order Management
  shopify_get_order_details,
  shopify_get_customer_orders,
  shopify_update_order_shipping_address,
  shopify_cancel_order,
  // Resolution & Refund
  shopify_create_store_credit,
  shopify_refund_order,
  shopify_create_return,
  shopify_add_tags,
  // Subscriptions
  skio_get_subscription_status,
  skio_skip_next_order_subscription,
  skio_pause_subscription,
  skio_unpause_subscription,
  skio_cancel_subscription,
  // Sales & Product
  shopify_create_discount_code,
  shopify_get_product_details,
  shopify_get_product_recommendations,
  shopify_get_collection_recommendations,
  shopify_get_related_knowledge_source,
  // Escalation (REQUIRED)
  escalate_to_human
]
