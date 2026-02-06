import { SystemMessage } from '@langchain/core/messages'
import { getLlm } from '../llm/client'
import { AgentState } from './state'

const tools = [
  {
    name: 'skio_get_subscription_status',
    description: 'Check status of a subscription',
    parameters: {
      type: 'object',
      properties: { email: { type: 'string' } },
      required: ['email']
    }
  },
  {
    name: 'skio_skip_next_order_subscription',
    description: 'Skip the immediate next order in subscription',
    parameters: {
      type: 'object',
      properties: { subscriptionId: { type: 'string' } },
      required: ['subscriptionId']
    }
  },
  {
    name: 'skio_pause_subscription',
    description: 'Pause subscription until date',
    parameters: {
      type: 'object',
      properties: {
        subscriptionId: { type: 'string' },
        pausedUntil: { type: 'string' }
      },
      required: ['subscriptionId', 'pausedUntil']
    }
  },
  {
    name: 'shopify_create_discount_code',
    description: 'Create retention discount code',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['percentage'] },
        value: { type: 'number' },
        duration: { type: 'number' },
        productIds: { type: 'array', items: { type: 'string' } }
      },
      required: ['type', 'value', 'duration']
    }
  },
  {
    name: 'skio_cancel_subscription',
    description: 'Cancel subscription permanently',
    parameters: {
      type: 'object',
      properties: {
        subscriptionId: { type: 'string' },
        cancellationReasons: { type: 'array', items: { type: 'string' } }
      },
      required: ['subscriptionId', 'cancellationReasons']
    }
  }
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
