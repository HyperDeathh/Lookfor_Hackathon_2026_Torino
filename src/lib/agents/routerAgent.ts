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
This agent handles PRE-DELIVERY issues and order modifications.
Available Tools:
- shopify_get_order_details: Look up order status, tracking info, items, shipping address
- shopify_get_customer_orders: List all orders for a customer by email
- shopify_update_order_shipping_address: Change delivery address (only if not yet shipped)
- shopify_cancel_order: Cancel an order (only if unfulfilled/not shipped yet)

ROUTE HERE when customer:
- Asks "Where is my order?" / "Siparişim nerede?"
- Wants to track their order / check order status
- Asks about shipping delays or delivery time
- Wants to cancel an UNFULFILLED order
- Needs to change shipping address before delivery
- Says "Order not shipped yet" / hasn't received shipping confirmation

## AGENT 2: RESOLUTION_REFUND
This agent handles POST-DELIVERY problems and refunds.
Available Tools:
- shopify_create_store_credit: Give store credit to compensate customer
- shopify_refund_order: Process a refund back to original payment method
- shopify_create_return: Create a return label for product return
- shopify_add_tags: Tag the order/customer for tracking

ROUTE HERE when customer:
- Received WRONG item
- Received EXPIRED product
- Product doesn't work / is defective / "patches fall off"
- Wants a REFUND (after delivery)
- Wants to RETURN product
- Says "Missing item from my order"
- Says "This place is a joke" + wants refund (angry after-delivery)
- Package says delivered but they didn't receive it

## AGENT 3: SUBSCRIPTION_RETENTION
This agent manages SUBSCRIPTIONS and prevents churn.
Available Tools:
- skio_get_subscriptions: Check subscription details, next billing date
- skio_skip_next_order_subscription: Skip the next scheduled shipment
- skio_pause_subscription: Temporarily pause the subscription
- skio_unpause_subscription: Resume a paused subscription
- skio_cancel_subscription: Cancel the subscription entirely
- shopify_create_discount_code: Create a discount code as retention offer

ROUTE HERE when customer:
- Wants to cancel their SUBSCRIPTION / "cancel all future orders"
- Says "Why did I receive another order?" (subscription confusion)
- Wants to pause/skip subscription
- Asks about subscription status / billing date
- Wants to resume subscription
- Says "Stop charging me" / billing concerns

## AGENT 4: SALES_PRODUCT
This agent handles pre-sales questions and positive interactions.
Available Tools:
- shopify_get_product_details: Get product information, ingredients, usage
- shopify_get_product_recommendations: Suggest related products
- shopify_get_collection_recommendations: Recommend product collections
- shopify_get_related_knowledge_source: Search FAQs, blogs, help articles
- shopify_create_discount_code: Generate discount codes for promotions

ROUTE HERE when customer:
- Says "Patch Power" or gives positive feedback/thanks
- Asks product usage questions ("How do I use pet patches?")
- Wants product recommendations
- Asks about ingredients or materials
- Has discount code issues / promo questions
- Just says hello / greeting
- General pre-purchase questions
- Asks "Are patches reusable?"
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
  message: string,
  conversationHistory?: string[]
): Promise<RouterDecision> => {
  const llm = getLlm()

  // Build conversation context
  const historyContext = conversationHistory && conversationHistory.length > 0
    ? `\n\n## CONVERSATION HISTORY (for context):\n${conversationHistory.map((m, i) => `${i + 1}. ${m}`).join('\n')}\n\nNOTE: Consider the conversation history when determining intent. A short message like "no its 1004" following an order tracking conversation should be treated as ORDER_MANAGEMENT continuation.`
    : ''

  const systemPrompt = `You are an intelligent Router for NATPAT (The Natural Patch Co) customer support AI.
Your job is to analyze the customer's message and route them to the BEST specialist agent.

YOU MUST THINK ABOUT WHICH TOOLS ARE NEEDED to help the customer.
Each agent has specific tools - route to the agent whose tools can solve the problem.

${AGENT_CAPABILITIES}

## CRITICAL ROUTING RULES:

1. ORDER vs SUBSCRIPTION:
   - "Cancel my order" / "Siparişimi iptal et" → ORDER_MANAGEMENT
   - "Cancel my subscription" / "Cancel all future orders" / "Aboneliğimi iptal et" → SUBSCRIPTION_RETENTION
   - "Why did I get another order?" (confusion) → SUBSCRIPTION_RETENTION
   - Just "cancel" without context → Ask which one, default ORDER_MANAGEMENT

2. PRE-DELIVERY vs POST-DELIVERY:
   - Problem BEFORE delivery (tracking, cancel, address change) → ORDER_MANAGEMENT
   - Problem AFTER delivery (wrong item, broken, refund, expired) → RESOLUTION_REFUND

3. POSITIVE MESSAGES:
   - "Patch Power", "Thanks!", positive feedback → SALES_PRODUCT

4. PRODUCT QUESTIONS:
   - How to use, ingredients, recommendations → SALES_PRODUCT

5. LANGUAGE: Customer may write in English or Turkish. Understand intent regardless of language.

6. FOLLOW-UP MESSAGES (CRITICAL!):
   - If customer says something short like "no its 1004" or "that one" or "yes" or a number:
   - LOOK AT CONVERSATION HISTORY to understand context
   - A number following order inquiry = ORDER_MANAGEMENT (it's an order correction)
    - NEVER route follow-ups to OTHER just because they're short
${historyContext}

7. UNRELATED TOPICS (STRICT):
   - If the user asks about general knowledge, cooking, math, coding, or anything NOT related to NATPAT, orders, or subscriptions:
   - Route to "OTHER"
   - Reason: "Unrelated topic"

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
