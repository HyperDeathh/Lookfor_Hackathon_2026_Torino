import { z } from 'zod'
import { SystemMessage, HumanMessage } from '@langchain/core/messages'
import { getLlm } from '../llm/client'

export type RouterIntent =
  | 'ORDER_MANAGEMENT'
  | 'RESOLUTION_REFUND'
  | 'SUBSCRIPTION_RETENTION'
  | 'SALES_PRODUCT'
  | 'OTHER'

export type RouterDecision = {
  intent: RouterIntent
  confidence: number
  reason: string
}

const routerDecisionSchema = z.object({
  intent: z.enum([
    'ORDER_MANAGEMENT',
    'RESOLUTION_REFUND',
    'SUBSCRIPTION_RETENTION',
    'SALES_PRODUCT',
    'OTHER'
  ]),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1)
})

// ═══════════════════════════════════════════════════════════════════════════
// TOOL-BASED AGENT CAPABILITIES
// Each agent is defined by the TOOLS they can use, not by keywords.
// The router knows what each agent CAN DO and decides accordingly.
// ═══════════════════════════════════════════════════════════════════════════

const AGENT_CAPABILITIES = `
## AGENT 1: ORDER_MANAGEMENT
This agent handles pre-delivery issues and order modifications.
Available Tools:
- shopify_get_order_details: Look up order status, tracking info, items, shipping address
- shopify_get_customer_orders: List all orders for a customer by email
- shopify_update_order_shipping_address: Change delivery address (only if not yet shipped)
- shopify_cancel_order: Cancel an order (only if unfulfilled/not shipped yet)

Use this agent when the customer needs:
- Track their order / "Where is my order?"
- Check order status
- Cancel an unfulfilled order
- Change shipping address before delivery

## AGENT 2: RESOLUTION_REFUND
This agent handles post-delivery problems and refunds.
Available Tools:
- shopify_create_store_credit: Give store credit to compensate customer
- shopify_refund_order: Process a refund back to original payment method
- shopify_create_return: Create a return label for product return
- shopify_add_tags: Tag the order/customer for tracking (e.g., "wrong_item", "refund_processed")

Use this agent when the customer needs:
- Report wrong item received
- Report missing item from order
- Product doesn't work / is defective
- Request a refund (after delivery)
- Request a return

## AGENT 3: SUBSCRIPTION_RETENTION
This agent manages subscriptions and prevents churn.
Available Tools:
- skio_get_subscription_status: Check subscription details, next billing date, status
- skio_skip_next_order_subscription: Skip the next scheduled shipment
- skio_pause_subscription: Temporarily pause the subscription
- skio_unpause_subscription: Resume a paused subscription
- skio_cancel_subscription: Cancel the subscription entirely
- shopify_create_discount_code: Create a discount code as retention offer

Use this agent when the customer needs:
- Cancel their subscription
- Pause their subscription
- Skip next shipment / "too much product"
- Check subscription status / billing date
- Resume subscription
- Any subscription billing issues

## AGENT 4: SALES_PRODUCT
This agent handles pre-sales questions and positive interactions.
Available Tools:
- shopify_get_product_details: Get product information, ingredients, usage
- shopify_get_product_recommendations: Suggest related products
- shopify_get_collection_recommendations: Recommend product collections
- shopify_get_related_knowledge_source: Search FAQs, blogs, help articles
- shopify_create_discount_code: Generate discount codes for sales/promotions

Use this agent when the customer needs:
- Product recommendations
- How to use a product
- Ingredient/material questions
- Discount code help / promo issues
- Positive feedback / thank you messages
- General pre-purchase questions
`

const extractJson = (content: string): unknown | null => {
  const start = content.indexOf('{')
  const end = content.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    return null
  }

  const slice = content.slice(start, end + 1)
  try {
    return JSON.parse(slice)
  } catch {
    return null
  }
}

export const classifyIntent = async (
  message: string
): Promise<RouterDecision> => {
  const llm = getLlm()

  const systemPrompt = `You are an intelligent Router for an ecommerce support AI.
Your job is to analyze the customer's message and route them to the BEST specialist agent.

YOU MUST THINK ABOUT WHICH TOOLS ARE NEEDED to help the customer.
Each agent has specific tools - route to the agent whose tools can solve the problem.

${AGENT_CAPABILITIES}

## ROUTING RULES:

1. THINK ABOUT THE TOOLS: What action needs to be taken? Which agent has those tools?

2. ORDER vs SUBSCRIPTION CANCELLATION:
   - "Cancel my order" / "Siparişimi iptal et" → ORDER_MANAGEMENT (uses shopify_cancel_order)
   - "Cancel my subscription" / "Aboneliğimi iptal et" → SUBSCRIPTION_RETENTION (uses skio_cancel_subscription)
   - Just "iptal" without context → Ask which one, but default to ORDER_MANAGEMENT

3. REFUND vs ORDER ISSUES:
   - Problem BEFORE delivery (tracking, cancel, address) → ORDER_MANAGEMENT
   - Problem AFTER delivery (wrong item, broken, refund) → RESOLUTION_REFUND

4. The user may write in English or Turkish. Understand intent regardless of language.

## OUTPUT FORMAT:
Return ONLY a JSON object:
{
  "intent": "ORDER_MANAGEMENT" | "RESOLUTION_REFUND" | "SUBSCRIPTION_RETENTION" | "SALES_PRODUCT" | "OTHER",
  "confidence": 0.0-1.0,
  "reason": "Brief explanation of why this agent and what tool might be needed"
}

Do NOT include any text before or after the JSON.`

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(`Customer message: "${message}"`)
  ])

  const content =
    typeof response.content === 'string'
      ? response.content
      : String(response.content)
  
  console.log('--- Router Raw Response ---')
  console.log(content)
  console.log('---------------------------')
  
  const parsed = extractJson(content)
  const validated = routerDecisionSchema.safeParse(parsed)

  if (validated.success) {
    return validated.data
  }

  // Minimal fallback - only if LLM completely fails
  console.warn('[Router] LLM parsing failed, using minimal fallback')
  return {
    intent: 'OTHER',
    confidence: 0.3,
    reason: 'Could not parse router response'
  }
}
