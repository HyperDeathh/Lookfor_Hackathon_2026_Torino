import { StateGraph, START, END } from '@langchain/langgraph'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { GraphState } from './state'
import { classifyIntent } from './routerAgent'
import { ALL_TOOLS } from './tools'
// Import Specialist Agents
import { orderManagementAgentNode } from './orderManagementAgent'
import { resolutionRefundAgentNode } from './resolutionRefundAgent'
import { subscriptionRetentionAgentNode } from './subscriptionRetentionAgent'
import { salesProductAgentNode } from './salesProductAgent'

// --- Nodes ---

// Router Node: Analyzes input and sets the intent
const routerNode = async (state: typeof GraphState.State) => {
  const lastMessage = state.messages[state.messages.length - 1]
  const text =
    typeof lastMessage.content === 'string'
      ? lastMessage.content
      : String(lastMessage.content)

  // Add logging wrapper around the tool node or handle it via a custom node if needed.
  // For simplicity, we rely on LangGraph's message history to trace tool calls.
  // But to explicitly add logs to our 'logs' state, we can use a custom function node that runs after tools?
  // Or better: Let's extract logs from 'messages' at the very end in the API route, as ToolMessages already contain the info.

  const decision = await classifyIntent(text)
  console.log('--- Router Decision ---')
  console.log('Intent:', decision.intent)
  console.log('Confidence:', decision.confidence)
  console.log('Reason:', decision.reason)
  console.log('-----------------------')

  return { intent: decision.intent }
}

// Tool Node: Executes the tools and handles escalation detection
const baseToolNode = new ToolNode(ALL_TOOLS)

// Custom tool node wrapper that detects escalation
const toolNodeWithEscalation = async (state: typeof GraphState.State) => {
  // Run the base tool node
  const result = await baseToolNode.invoke(state)
  
  // Check if any tool message indicates escalation
  const messages = result.messages || []
  for (const msg of messages) {
    if (msg.name === 'escalate_to_human') {
      console.log('[ESCALATION] Detected escalation tool call - setting isEscalated flag')
      // Parse the escalation summary from the tool output
      let escalationData = null
      try {
        const parsed = JSON.parse(
          typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
        )
        escalationData = parsed.data || parsed
      } catch {
        escalationData = { raw: msg.content }
      }
      
      return {
        ...result,
        isEscalated: true,
        escalationSummary: escalationData
      }
    }
  }
  
  return result
}

// --- Conditions ---

// Determine which agent to go to after Router
const routeToAgent = (state: typeof GraphState.State) => {
  switch (state.intent) {
    case 'ORDER_MANAGEMENT':
      return 'order_management'
    case 'RESOLUTION_REFUND':
      return 'resolution_refund'
    case 'SUBSCRIPTION_RETENTION':
      return 'subscription_retention'
    case 'SALES_PRODUCT':
      return 'sales_product'
    default:
      // Fallback: Use Order Management or a Generic handler.
      // For now, let's route "OTHER" to sales/product as a general receptionist
      return 'sales_product'
  }
}

// Check if the agent requested a tool call or is done
const shouldContinue = (state: typeof GraphState.State) => {
  // --- ESCALATION CHECK (HACKATHON REQUIREMENT) ---
  // If the session is already escalated, STOP all automation
  if (state.isEscalated) {
    console.log('-> Session is ESCALATED - stopping automation')
    return END
  }

  const messages = state.messages
  const lastMessage = messages[messages.length - 1]

  // If the LLM sent a tool_calls array, we must answer it
  if (
    'tool_calls' in lastMessage &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls.length > 0
  ) {
    // Check if any of the tool calls is an escalation
    const hasEscalation = lastMessage.tool_calls.some(
      (tc: { name?: string }) => tc.name === 'escalate_to_human'
    )
    if (hasEscalation) {
      console.log('-> Agent is ESCALATING to human')
    } else {
      console.log('-> Agent deciding to call tools:', lastMessage.tool_calls.length)
    }
    return 'tools'
  }

  // Otherwise, we are done
  console.log('-> Agent deciding to END')
  return END
}

// --- Workflow Definition ---

export const createWorkflow = () => {
  const routeToolOutput = (state: typeof GraphState.State) => {
    switch (state.intent) {
      case 'ORDER_MANAGEMENT':
        return 'order_management'
      case 'RESOLUTION_REFUND':
        return 'resolution_refund'
      case 'SUBSCRIPTION_RETENTION':
        return 'subscription_retention'
      case 'SALES_PRODUCT':
        return 'sales_product'
      default:
        return END
    }
  }

  const workflow = new StateGraph(GraphState)
    // Add Nodes
    .addNode('router', routerNode)
    .addNode('order_management', orderManagementAgentNode)
    .addNode('resolution_refund', resolutionRefundAgentNode)
    .addNode('subscription_retention', subscriptionRetentionAgentNode)
    .addNode('sales_product', salesProductAgentNode)
    .addNode('tools', toolNodeWithEscalation)

    // Add Edges
    // 1. Start -> Router
    .addEdge(START, 'router')

    // 2. Router -> Specialist Agent (Conditional)
    .addConditionalEdges('router', routeToAgent, [
      'order_management',
      'resolution_refund',
      'subscription_retention',
      'sales_product'
    ])

    // 3. Specialist Agents -> Tools OR End (Conditional)
    .addConditionalEdges('order_management', shouldContinue, ['tools', END])
    .addConditionalEdges('resolution_refund', shouldContinue, ['tools', END])
    .addConditionalEdges('subscription_retention', shouldContinue, [
      'tools',
      END
    ])
    .addConditionalEdges('sales_product', shouldContinue, ['tools', END])

    // 4. Tools -> Return to the agent that called them
    .addConditionalEdges('tools', routeToolOutput, [
      'order_management',
      'resolution_refund',
      'subscription_retention',
      'sales_product',
      END
    ])

  return workflow.compile()
}
