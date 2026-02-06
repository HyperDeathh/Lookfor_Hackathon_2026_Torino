import { z } from 'zod'
import { SystemMessage, HumanMessage } from '@langchain/core/messages'
import { getLlm } from '../llm/client'

export type RouterIntent =
  | 'SHIPPING'
  | 'WRONG_ITEM'
  | 'PRODUCT_ISSUE'
  | 'ORDER_MODIFICATION'
  | 'SUBSCRIPTION'
  | 'OTHER'

export type RouterDecision = {
  intent: RouterIntent
  confidence: number
  reason: string
}

const routerDecisionSchema = z.object({
  intent: z.enum([
    'SHIPPING',
    'WRONG_ITEM',
    'PRODUCT_ISSUE',
    'ORDER_MODIFICATION',
    'SUBSCRIPTION',
    'OTHER'
  ]),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1)
})

const fallbackDecision = (message: string): RouterDecision => {
  const text = message.toLowerCase()

  const hasAny = (patterns: RegExp[]) =>
    patterns.some(pattern => pattern.test(text))

  if (
    hasAny([
      /tracking/,
      /where\s+is\s+my\s+order/,
      /delivery/,
      /shipping/,
      /in\s+transit/
    ])
  ) {
    return {
      intent: 'SHIPPING',
      confidence: 0.55,
      reason: 'Detected shipping inquiry.'
    }
  }

  if (
    hasAny([
      /wrong\s+item/,
      /missing\s+item/,
      /missing\s+pack/,
      /not\s+in\s+the\s+box/
    ])
  ) {
    return {
      intent: 'WRONG_ITEM',
      confidence: 0.55,
      reason: 'Detected wrong or missing item.'
    }
  }

  if (
    hasAny([/no\s+effect/, /didn['’]t\s+work/, /not\s+working/, /ineffective/])
  ) {
    return {
      intent: 'PRODUCT_ISSUE',
      confidence: 0.55,
      reason: 'Detected product issue.'
    }
  }

  if (
    hasAny([/cancel/, /change\s+address/, /update\s+address/, /modify\s+order/])
  ) {
    return {
      intent: 'ORDER_MODIFICATION',
      confidence: 0.55,
      reason: 'Detected order modification request.'
    }
  }

  if (hasAny([/subscription/, /pause/, /skip/, /charged/, /billing/])) {
    return {
      intent: 'SUBSCRIPTION',
      confidence: 0.55,
      reason: 'Detected subscription issue.'
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
    'You are a router agent for an ecommerce support system. ' +
    'Classify the user message into exactly one intent: ' +
    'SHIPPING, WRONG_ITEM, PRODUCT_ISSUE, ORDER_MODIFICATION, SUBSCRIPTION, OTHER. ' +
    'Return ONLY a JSON object with keys: intent, confidence, reason. ' +
    'confidence must be a number between 0 and 1. ' +
    'reason must be short and specific.'

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
