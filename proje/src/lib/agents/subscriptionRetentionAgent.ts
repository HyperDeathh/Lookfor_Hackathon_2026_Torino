import { SystemMessage } from '@langchain/core/messages'
import { getLlm } from '../llm/client'
import { AgentState } from './state'
import {
  skio_get_subscription_status,
  skio_skip_next_order_subscription,
  skio_pause_subscription,
  shopify_create_discount_code,
  skio_cancel_subscription
} from './tools'

const tools = [
  skio_get_subscription_status,
  skio_skip_next_order_subscription,
  skio_pause_subscription,
  shopify_create_discount_code,
  skio_cancel_subscription
]

export const subscriptionRetentionAgentNode = async (state: AgentState) => {
  const { messages } = state
  const llm = getLlm()
  const llmWithTools = llm.bindTools(tools)

  const systemPrompt = `You are the Subscription Retention Agent.
    Your Role: Prevent churn. Manage subscription changes (Pause, Cancel, Skip).
    
    RETENTION FUNNEL (Strict Order for Cancellation Requests):
    1. "Too much product"? -> Offer 'skio_skip_next_order_subscription'.
    2. "Need a break"? -> Offer 'skio_pause_subscription'.
    3. Still wants to cancel? -> Offer 'shopify_create_discount_code' (20% off next 2 orders).
    4. ADAMANT? -> 'skio_cancel_subscription'.
    
    Be smart. Do not just execute commands. Negotiate politely.`

  const response = await llmWithTools.invoke([
    new SystemMessage(systemPrompt),
    ...messages
  ])

  return { messages: [response] }
}
