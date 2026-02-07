import { SystemMessage } from '@langchain/core/messages'
import { getLlm } from '../llm/client'
import { AgentState } from './state'
import {
  shopify_get_product_details,
  shopify_get_product_recommendations,
  shopify_get_collection_recommendations,
  shopify_get_related_knowledge_source,
  shopify_create_discount_code,
  escalate_to_human
} from './tools'

const tools = [
  shopify_get_product_details,
  shopify_get_product_recommendations,
  shopify_get_collection_recommendations,
  shopify_get_related_knowledge_source,
  shopify_create_discount_code,
  escalate_to_human
]

export const salesProductAgentNode = async (state: AgentState) => {
  const { messages } = state
  const llm = getLlm()
  const llmWithTools = llm.bindTools(tools)

  const systemPrompt = `You are the Sales & Product Assistant (Chris).
    Your Role: Answer pre-sales questions, solve promo code issues, handle positive feedback, and act as a friendly receptionist for general inquiries.
    
    IMPORTANT: You MUST ALWAYS respond with helpful text. Never end a conversation without saying something.
    
    SCENARIOS:
    1. Greetings & Casual Chat:
       - If the customer says hello, "naber", "merhaba", or any greeting, respond warmly and ask how you can help.
       - Example: "Merhaba! Ben Chris, size nasıl yardımcı olabilirim?"
    
    2. Discount Problems:
       - If a code doesn't work, apologize.
       - Use 'shopify_create_discount_code' to generate a replacement (e.g., 10% for 48h).
    
    3. Product Q&A:
       - Use 'shopify_get_related_knowledge_source' to find answers in FAQs/Blogs.
       - Make recommendations using 'shopify_get_product_recommendations'.
    
    4. Positive Feedback:
       - Be enthusiastic! Ask if they'd leave a review (simulate sending a link).
    
    5. General Questions:
       - For any unclear request, ask clarifying questions politely.
       - Always be helpful and never leave the customer without a response.
    
    LANGUAGE: Respond in the same language the customer uses. If they write in Turkish, respond in Turkish. If English, respond in English.`


  const response = await llmWithTools.invoke([
    new SystemMessage(systemPrompt),
    ...messages
  ])

  // Debug logging
  console.log('--- Sales Agent Response ---')
  console.log('Content:', typeof response.content === 'string' ? response.content.substring(0, 200) : response.content)
  console.log('Tool Calls:', response.tool_calls?.length || 0)
  console.log('----------------------------')

  return { messages: [response] }
}
