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

const fallbackDecision = (message: string): RouterDecision => {
  const text = message.toLowerCase()

  const hasAny = (patterns: RegExp[]) =>
    patterns.some(pattern => pattern.test(text))

  // Agent 1: Order Management (Shipping, Modification)
  if (
    hasAny([
      /tracking/, /where\s+is\s+my\s+order/, /delivery/, /shipping/, /in\s+transit/,
      /cancel\s+order/, /change\s+address/, /update\s+address/, /modify\s+order/, /late/
    ])
  ) {
    return {
      intent: 'ORDER_MANAGEMENT',
      confidence: 0.6,
      reason: 'Detected order inquiry or modification request.'
    }
  }

  // Agent 2: Resolution & Refund (Wrong Item, Product Issue)
  if (
    hasAny([
      /wrong\s+item/, /missing\s+item/, /missing\s+pack/, /broken/, /damaged/,
      /no\s+effect/, /didn['’]t\s+work/, /not\s+working/, /ineffective/, /refund/, /money\s+back/
    ])
  ) {
    return {
      intent: 'RESOLUTION_REFUND',
      confidence: 0.6,
      reason: 'Detected product issue or refund request.'
    }
  }

  // Agent 3: Subscription Retention (Subscription, Billing)
  if (hasAny([/subscription/, /pause/, /skip/, /charged/, /billing/, /cancel\s+sub/, /too\s+much\s+product/])) {
    return {
      intent: 'SUBSCRIPTION_RETENTION',
      confidence: 0.6,
      reason: 'Detected subscription or billing issue.'
    }
  }

  // Agent 4: Sales & Product (Discount, Promo, Product Info, Positive Feedback)
  if (hasAny([
    /discount/, /promo/, /code/, /coupon/, /invalid/,
    /how\s+to\s+use/, /recommend/, /ingredient/, /what\s+is/,
    /thank/, /love/, /great/, /amazing/
  ])) {
    return {
      intent: 'SALES_PRODUCT',
      confidence: 0.6,
      reason: 'Detected sales, product question, or feedback.'
    }
  }

  return {
    intent: 'OTHER',
    confidence: 0.4,
    reason: 'No clear intent detected.'
  }
}

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

  const systemPrompt =
    'You are the Main Router (Switchboard Operator) for an ecommerce support AI. ' +
    'Your job is to classify the user\'s need into one of 4 specialized agents.\n\n' +
    'AGENTS:\n' +
    '1. ORDER_MANAGEMENT: Shipping delays, "Where is my order?", Order modification (address change, cancel BEFORE ship).\n' +
    '2. RESOLUTION_REFUND: Wrong item, Missing item, Product ineffective ("didn\'t work"), Refund requests (after delivery).\n' +
    '3. SUBSCRIPTION_RETENTION: Manage subscription (skip, pause, cancel), Billing issues, "Too much stock".\n' +
    '4. SALES_PRODUCT: Discount code issues, Product questions ("how to use"), Recommendations, Positive feedback.\n' +
    'Return ONLY a JSON object with keys: intent, confidence (0-1), reason.\n' +
    'Intent must be one of: ORDER_MANAGEMENT, RESOLUTION_REFUND, SUBSCRIPTION_RETENTION, SALES_PRODUCT, OTHER.'

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(`Message: ${message}`)
  ])

  const content =
    typeof response.content === 'string'
      ? response.content
      : String(response.content)
  const parsed = extractJson(content)
  const validated = routerDecisionSchema.safeParse(parsed)

  if (validated.success) {
    return validated.data
  }

  return fallbackDecision(message)
}
