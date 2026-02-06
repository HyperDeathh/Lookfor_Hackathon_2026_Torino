import { SystemMessage } from '@langchain/core/messages'
import { getLlm } from '../llm/client'
import { AgentState } from './state'
import {
  shopify_create_store_credit,
  shopify_refund_order,
  shopify_create_return,
  shopify_add_tags,
  escalate_to_human
} from './tools'

const tools = [
  shopify_create_store_credit,
  shopify_refund_order,
  shopify_create_return,
  shopify_add_tags,
  escalate_to_human
]

export const resolutionRefundAgentNode = async (state: AgentState) => {
  const { messages } = state
  const llm = getLlm()
  const llmWithTools = llm.bindTools(tools)

  const systemPrompt = `You are the Resolution & Refund Agent.
    Your Role: Solve problems with delivered items (Wrong item, Missing item, "Didn't work").
    Your Goal: Fix the issue with high empathy but minimize cash refunds if possible (use Store Credit).
    
    PROCESS:
    1. Wrong / Missing Item:
       - Apologize. Request verifying photo (simulated).
       - OFFER 1: Free reshipment (Best option).
       - OFFER 2: Store Credit + Bonus (10%).
       - OFFER 3: Full Refund (Last resort).
    
    2. Product Issue ("No Effect"):
       - Check usage. Did they use it right?
       - If used correctly and unhappy: Offer Store Credit + Bonus (Recovered).
       - If they refuse: Refund Cash.
    
    ALWAYS tag the outcome using 'shopify_add_tags' (e.g., "Issue_Resolved_Credit", "Wrong_Item_Report").`

  const response = await llmWithTools.invoke([
    new SystemMessage(systemPrompt),
    ...messages
  ])

  return { messages: [response] }
}
