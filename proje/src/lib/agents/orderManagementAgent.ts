import { SystemMessage } from '@langchain/core/messages'
import { getLlm } from '../llm/client'
import { AgentState } from './state'
import {
  shopify_get_order_details,
  shopify_get_customer_orders,
  shopify_update_order_shipping_address,
  shopify_cancel_order,
  escalate_to_human
} from './tools'

// Tool Definitions
const tools = [
  shopify_get_order_details,
  shopify_get_customer_orders,
  shopify_update_order_shipping_address,
  shopify_cancel_order,
  escalate_to_human
]

export const orderManagementAgentNode = async (state: AgentState) => {
  const { messages } = state
  const llm = getLlm()
  const llmWithTools = llm.bindTools(tools)

  const systemPrompt = `You are the Order Management Agent.
    Your Role: Handle shipping inquiries ("Where is my order?") and order modifications (Cancel, Address Change).
    
    KEY GUIDELINES:
    1. Shipping Delay:
       - If status is DELIVERED but customer says "not received": Ask them to wait 24h before panic (carriers mark early).
       - If status is IN_TRANSIT but late: Apologize sincerely.
       - Always verify status using 'shopify_get_order_details'.
    
    2. Order Modification:
       - Cancellation: Check if fulfilled. If YES, you cannot cancel (offer return process instead - redirect to Resolution Agent logic if needed, but try to handle politely). If NO, use 'shopify_cancel_order'.
       - Address Change: Check if fulfilled. If NO, use 'shopify_update_order_shipping_address'.
    
    Be efficient, polite, and operational.`

  const response = await llmWithTools.invoke([
    new SystemMessage(systemPrompt),
    ...messages
  ])

  return { messages: [response] }
}
