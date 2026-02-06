import { SystemMessage } from '@langchain/core/messages'
import { getLlm } from '../llm/client'
import { AgentState } from './state'

// Tool Definitions
const tools = [
  {
    name: 'shopify_get_order_details',
    description: 'Get details of a specific order by ID',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string' }
      },
      required: ['orderId']
    }
  },
  {
    name: 'shopify_get_customer_orders',
    description: 'Get list of recent orders for a customer email',
    parameters: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        limit: { type: 'number' }
      },
      required: ['email']
    }
  },
  {
    name: 'shopify_update_order_shipping_address',
    description: 'Update the shipping address for an unfulfilled order',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string' },
        shippingAddress: {
          type: 'object',
          properties: {
            address1: { type: 'string' },
            city: { type: 'string' },
            zip: { type: 'string' },
            country: { type: 'string' }
          },
          required: ['address1', 'city', 'zip', 'country']
        }
      },
      required: ['orderId', 'shippingAddress']
    }
  },
  {
    name: 'shopify_cancel_order',
    description: 'Cancel an order (only if unfulfilled)',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string' },
        reason: { type: 'string', enum: ['CUSTOMER', 'OTHER'] }
      },
      required: ['orderId', 'reason']
    }
  }
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
