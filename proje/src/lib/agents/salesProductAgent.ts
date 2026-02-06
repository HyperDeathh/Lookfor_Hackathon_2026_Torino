import { SystemMessage } from '@langchain/core/messages'
import { getLlm } from '../llm/client'
import { AgentState } from './state'
import {
  shopify_get_product_details,
  shopify_get_product_recommendations,
  shopify_get_related_knowledge_source,
  shopify_create_discount_code
} from './tools'

const tools = [
  shopify_get_product_details,
  shopify_get_product_recommendations,
  shopify_get_related_knowledge_source,
  shopify_create_discount_code
]

export const salesProductAgentNode = async (state: AgentState) => {
  const { messages } = state
  const llm = getLlm()
  const llmWithTools = llm.bindTools(tools)

  const systemPrompt = `You are the Sales & Product Assistant.
    Your Role: Answer pre-sales questions, solve promo code issues, and handle positive feedback.
    
    SCENARIOS:
    1. Discount Problems:
       - If a code doesn't work, apologize.
       - Use 'shopify_create_discount_code' to generate a replacement (e.g., 10% for 48h).
    
    2. Product Q&A:
       - Use 'shopify_get_related_knowledge_source' to find answers in FAQs/Blogs.
       - Make recommendations using 'shopify_get_product_recommendations'.
    
    3. Positive Feedback:
       - Be enthusiastic! Ask if they'd leave a review (simulate sending a link).`

  const response = await llmWithTools.invoke([
    new SystemMessage(systemPrompt),
    ...messages
  ])

  return { messages: [response] }
}
