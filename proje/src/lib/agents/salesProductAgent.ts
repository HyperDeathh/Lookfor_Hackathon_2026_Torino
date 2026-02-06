import { SystemMessage } from '@langchain/core/messages'
import { getLlm } from '../llm/client'
import { AgentState } from './state'

const tools = [
  {
    name: 'shopify_get_product_details',
    description: 'Get product specs and details',
    parameters: {
      type: 'object',
      properties: {
        queryType: { type: 'string', enum: ['id', 'name', 'key feature'] },
        queryKey: { type: 'string' }
      },
      required: ['queryType', 'queryKey']
    }
  },
  {
    name: 'shopify_get_product_recommendations',
    description: 'Get product recommendations based on keywords',
    parameters: {
      type: 'object',
      properties: {
        queryKeys: { type: 'array', items: { type: 'string' } }
      },
      required: ['queryKeys']
    }
  },
  {
    name: 'shopify_get_related_knowledge_source',
    description: 'Search FAQs, Blogs, and Docs',
    parameters: {
      type: 'object',
      properties: {
        question: { type: 'string' },
        specificToProductId: { type: 'string' }
      },
      required: ['question']
    }
  },
  {
    name: 'shopify_create_discount_code',
    description: 'Fix invalid code issues by issuing new one',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['percentage', 'fixed'] },
        value: { type: 'number' },
        duration: { type: 'number' }
      },
      required: ['type', 'value', 'duration']
    }
  }
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
